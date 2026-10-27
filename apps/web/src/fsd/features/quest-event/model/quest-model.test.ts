import { describe, expect, it } from "vitest"
import {
  questCratesFixture,
  questEventsFixture,
} from "@workspace/game-catalog/testing"

import { selectQuestInstance } from "./quest-instance"
import {
  fitObjectives,
  parseBattleEntry,
  parseQuestProgress,
} from "./quest-progress"
import { scoreQuest, type QuestBattleEntry } from "./quest-score"

const definitions = new Map([
  [
    "quest",
    {
      type: "Quest",
      config: { durationHours: 72, rewardsClaimWindowHours: 24 },
    },
  ],
  ["hre", { type: "NewCharacterEvent" }],
])

const occurrence = (id: string, start: string, end: string, hero: string) => ({
  occurrenceId: id,
  definitionId: "quest",
  startUtc: start,
  endUtc: end,
  parameters: { featuredCharacterId: hero },
})

const nubari = occurrence(
  "occ-2026-10-21-quest-nubari-vs-black-legion",
  "2026-10-21T00:00:00Z",
  "2026-10-24T00:00:00Z",
  "astarEradicator"
)
const kimm = occurrence(
  "occ-2026-11-11-quest-kimm-vs-orks",
  "2026-11-11T00:00:00Z",
  "2026-11-14T00:00:00Z",
  "votanChampion"
)
const calendar = [nubari, kimm]
const at = (iso: string) => Date.parse(iso)

const quest = (hero: string) =>
  questEventsFixture.find((record) => record.featuredCharacterId === hero)!
const nubariQuest = quest("astarEradicator")

describe("selectQuestInstance", () => {
  it("shows Nubari while running", () => {
    const instance = selectQuestInstance(
      calendar,
      definitions,
      at("2026-10-23T18:00:00Z")
    )
    expect(instance).toMatchObject({
      key: nubari.occurrenceId,
      phase: "running",
      featuredCharacterId: "astarEradicator",
    })
  })

  it("keeps Nubari in its claim window, ending 24 h after the quest", () => {
    const instance = selectQuestInstance(
      calendar,
      definitions,
      at("2026-10-24T10:00:00Z")
    )
    expect(instance?.phase).toBe("claim")
    expect(instance?.claimEndMs).toBe(at("2026-10-25T00:00:00Z"))
  })

  it("previews Kîmm once the claim window closes", () => {
    const instance = selectQuestInstance(
      calendar,
      definitions,
      at("2026-10-25T00:00:00Z")
    )
    expect(instance).toMatchObject({
      key: kimm.occurrenceId,
      phase: "preview",
    })
  })

  it("prefers the latest start, then the lowest id, and ignores other event types", () => {
    const later = occurrence(
      "occ-b",
      "2026-10-22T00:00:00Z",
      "2026-10-25T00:00:00Z",
      "astarCyrus"
    )
    const sameStart = { ...later, occurrenceId: "occ-a" }
    const hre = { ...later, occurrenceId: "occ-0", definitionId: "hre" }
    expect(
      selectQuestInstance(
        [nubari, later, sameStart, hre],
        definitions,
        at("2026-10-23T00:00:00Z")
      )?.key
    ).toBe("occ-a")
    expect(selectQuestInstance([], definitions, 0)).toBeNull()
  })
})

const full = (objectives: boolean[]): QuestBattleEntry => ({
  medals: 3,
  lightning: 100,
  objectives,
})

describe("scoreQuest", () => {
  it("scores Nubari battle 1 at 500 / 600 with one of two objectives", () => {
    const score = scoreQuest(
      nubariQuest.battles,
      { 1: full([false, true]) },
      questCratesFixture
    )
    expect(score.battles[0]).toEqual({
      number: 1,
      points: 500,
      max: 600,
      left: 100,
    })
    expect(score.tiers[0]).toEqual({ tier: "Common", points: 500, max: 1600 })
  })

  it("scores a partial Lightning Victory as the game does (499 / 500)", () => {
    const score = scoreQuest(
      nubariQuest.battles,
      { 8: { medals: 3, lightning: 99, objectives: [true] } },
      questCratesFixture
    )
    expect(score.battles[7]).toMatchObject({ points: 499, max: 500 })
  })

  it("counts nothing for a battle with 0 medals", () => {
    const score = scoreQuest(
      nubariQuest.battles,
      { 1: { medals: 0, lightning: 100, objectives: [true, true] } },
      questCratesFixture
    )
    expect(score.battles[0]?.points).toBe(0)
    expect(score.total).toBe(0)
  })

  it("counts crates opened and the points to the next one", () => {
    const crates = [
      { number: 5, points: 2000 },
      { number: 6, points: 2500 },
      { number: 4, points: 1500 },
    ]
    const score = scoreQuest(
      [
        { number: 1, tier: "Common", objectives: [{ score: 2000 }] },
        { number: 2, tier: "Common", objectives: [] },
      ],
      { 1: full([true]), 2: { medals: 2, lightning: 0, objectives: [] } },
      crates
    )
    expect(score.total).toBe(2600)
    expect(score.cratesOpened).toBe(3)
    expect(score.nextCrate).toBeNull()
    const lower = scoreQuest(
      [{ number: 1, tier: "Common", objectives: [{ score: 1900 }] }],
      { 1: full([true]) },
      crates
    )
    expect(lower.total).toBe(2300)
    expect(lower.cratesOpened).toBe(2)
    expect(lower.nextCrate).toEqual({
      number: 6,
      points: 2500,
      pointsLeft: 200,
    })
  })

  it("opens all 17 crates at 8,800 with nothing left", () => {
    const entries = Object.fromEntries(
      nubariQuest.battles.map((battle) => [
        battle.number,
        full(battle.objectives.map(() => true)),
      ])
    )
    const score = scoreQuest(nubariQuest.battles, entries, questCratesFixture)
    expect(score.total).toBe(8800)
    expect(score.max).toBe(8800)
    expect(score.cratesOpened).toBe(17)
    expect(score.nextCrate).toBeNull()
    expect(score.pointsLeft).toEqual([])
  })

  it("lists points left by most left, then by number", () => {
    const score = scoreQuest(nubariQuest.battles, {}, questCratesFixture)
    const left = score.pointsLeft.map((battle) => battle.left)
    expect(left).toEqual([...left].sort((a, b) => b - a))
    expect(score.pointsLeft).toHaveLength(17)
  })
})

describe("quest progress parsing", () => {
  it("clamps medals and Lightning Victory, and drops invalid entries", () => {
    expect(
      parseBattleEntry({ medals: 7, lightning: 140, objectives: [true, 1] })
    ).toEqual({ medals: 3, lightning: 100, objectives: [true, false] })
    expect(parseBattleEntry({ medals: "3" })).toBeNull()
    expect(
      parseQuestProgress({
        battles: { 1: { medals: 2, lightning: 50, objectives: [] }, x: {} },
      })
    ).toEqual({ battles: { 1: { medals: 2, lightning: 50, objectives: [] } } })
  })

  it("pads or cuts ticks to the served objective count", () => {
    const entry = { medals: 3, lightning: 100, objectives: [true] }
    expect(fitObjectives(entry, 3).objectives).toEqual([true, false, false])
    expect(
      fitObjectives({ ...entry, objectives: [true, true, true] }, 2).objectives
    ).toEqual([true, true])
  })
})

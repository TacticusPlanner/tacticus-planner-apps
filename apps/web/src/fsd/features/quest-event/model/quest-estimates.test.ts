import { describe, expect, it } from "vitest"

import type { NpcRecord, NpcStatRow } from "@/entities/npc"

import type { QuestBattle } from "./quest-battles"
import {
  calibrateQuestPowerRatio,
  estimateQuestBattle,
  projectQuest,
  questBattlePower,
  questVerdict,
  type QuestBattleEstimate,
} from "./quest-estimates"
import type { QuestObjectiveBadge, QuestTeam } from "./quest-team"

const row = (power: number): NpcStatRow => ({
  abilityLevel: 1,
  damage: power,
  armour: 0,
  health: 0,
  progressionIndex: 0,
  rank: 0,
  stars: 0,
})
const npc = (id: string, kind: NpcRecord["kind"] = "unit") =>
  ({ id, kind, stats: [row(400), row(350)] }) as unknown as NpcRecord

describe("questBattlePower", () => {
  const npcs = new Map([
    ["flayed", npc("flayed")],
    ["warrior", npc("warrior")],
    ["powupHeal", npc("powupHeal", "object")],
  ])
  const powerOf = (_id: string, stats: NpcStatRow) => stats.damage

  it("sums count × NPC power over the enemies, skipping board pickups", () => {
    expect(
      questBattlePower(
        {
          power: null,
          enemies: [
            { id: "flayed", ladderIndex: 1, count: 3 },
            { id: "warrior", ladderIndex: 2, count: 4 },
            { id: "powupHeal", ladderIndex: 1, count: 2 },
          ],
        },
        (id) => npcs.get(id),
        powerOf
      )
    ).toBe(3 * 400 + 4 * 350)
  })

  it("prefers the recorded power", () => {
    expect(
      questBattlePower(
        { power: 1183, enemies: [{ id: "flayed", ladderIndex: 1, count: 3 }] },
        (id) => npcs.get(id),
        powerOf
      )
    ).toBe(1183)
  })

  it("is unknown for an unknown enemy or an index past the ladder", () => {
    expect(
      questBattlePower(
        { power: null, enemies: [{ id: "flayed", ladderIndex: 9, count: 1 }] },
        (id) => npcs.get(id),
        powerOf
      )
    ).toBeNull()
    expect(
      questBattlePower(
        { power: null, enemies: [{ id: "nobody", ladderIndex: 1, count: 1 }] },
        (id) => npcs.get(id),
        powerOf
      )
    ).toBeNull()
  })
})

const team = (
  members: { unitId: string; atCap?: boolean }[],
  totalPower: number,
  badges: QuestObjectiveBadge[] = [],
  breakers: string[][] = []
): QuestTeam => ({
  members: members.map((member, index) => ({
    unitId: member.unitId,
    featured: index === 0,
    power: 0,
    atCap: member.atCap ?? true,
  })),
  totalPower,
  eligibleCount: members.length - 1,
  openSlots: 2,
  badges,
  breakers,
  powerUnavailable: false,
})

const psykerBattle = {
  objectives: [{ type: "NotTrait", target: "Psyker", score: 100 }],
}

describe("estimateQuestBattle", () => {
  const noGain = () => null

  it("clears comfortably for the full points without a second team", () => {
    let built = false
    const estimate = estimateQuestBattle({
      battle: psykerBattle,
      battlePower: 50_000,
      team: team([{ unitId: "hero" }, { unitId: "a" }], 60_000, [
        { kind: "met" },
      ]),
      buildHardRulesTeam: () => {
        built = true
        return team([{ unitId: "hero" }], 0)
      },
      gainAtCap: noGain,
    })

    expect(estimate).toMatchObject({
      kind: "ready",
      first: { clears: true, marginal: false, points: 500 },
      second: null,
      shortfall: null,
    })
    expect(
      estimate.kind === "ready" && Math.round(estimate.first.margin * 100)
    ).toBe(20)
    expect(built).toBe(false)
    expect(questVerdict(estimate)).toBe("clears")
  })

  it("marks a margin under 15% as close and shows the second team", () => {
    const estimate = estimateQuestBattle({
      battle: psykerBattle,
      battlePower: 50_000,
      team: team([{ unitId: "hero" }, { unitId: "a" }], 54_000, [
        { kind: "met" },
      ]),
      buildHardRulesTeam: () =>
        team(
          [{ unitId: "hero" }, { unitId: "ahriman" }],
          70_000,
          [{ kind: "notMet" }],
          [["ahriman"]]
        ),
      gainAtCap: noGain,
    })

    expect(questVerdict(estimate)).toBe("close")
    expect(estimate).toMatchObject({
      second: {
        clears: true,
        points: 400,
        givenUp: [{ index: 0, breakers: ["ahriman"] }],
      },
    })
  })

  it("trades the objective for a clear when only the hard-rules team clears", () => {
    const estimate = estimateQuestBattle({
      battle: psykerBattle,
      battlePower: 50_000,
      team: team([{ unitId: "hero" }, { unitId: "a" }], 40_000, [
        { kind: "met" },
      ]),
      buildHardRulesTeam: () =>
        team(
          [{ unitId: "hero" }, { unitId: "ahriman" }],
          55_000,
          [{ kind: "notMet" }],
          [["ahriman"]]
        ),
      gainAtCap: noGain,
    })

    expect(questVerdict(estimate)).toBe("fails")
    expect(estimate).toMatchObject({
      first: { clears: false, points: 500 },
      second: { clears: true, points: 400 },
      shortfall: null,
    })
  })

  it("drops the second estimate when the hard-rules team is the same", () => {
    const same = team([{ unitId: "hero" }, { unitId: "a" }], 40_000, [
      { kind: "met" },
    ])
    expect(
      estimateQuestBattle({
        battle: psykerBattle,
        battlePower: 50_000,
        team: same,
        buildHardRulesTeam: () => same,
        gainAtCap: noGain,
      })
    ).toMatchObject({ second: null })
  })

  it("shows the shortfall and up to 3 cap gains when neither clears", () => {
    const below = ["a", "b", "c", "d"].map((unitId) => ({
      unitId,
      atCap: false,
    }))
    const gains: Record<string, number> = { a: 100, b: 400, c: 300, d: 200 }
    const estimate = estimateQuestBattle({
      battle: psykerBattle,
      battlePower: 50_000,
      team: team([{ unitId: "hero" }, ...below], 40_000, [{ kind: "met" }]),
      buildHardRulesTeam: () =>
        team([{ unitId: "hero" }, { unitId: "x" }], 30_000, [
          { kind: "notMet" },
        ]),
      gainAtCap: (unitId) => gains[unitId] ?? null,
    })

    expect(estimate).toMatchObject({
      shortfall: expect.closeTo(0.2, 5),
      capGains: [
        { unitId: "b", gain: 400 },
        { unitId: "c", gain: 300 },
        { unitId: "d", gain: 200 },
      ],
    })
  })

  it("is unknown without the battle power", () => {
    expect(
      estimateQuestBattle({
        battle: psykerBattle,
        battlePower: null,
        team: team([{ unitId: "hero" }], 1000),
        buildHardRulesTeam: () => team([{ unitId: "hero" }], 1000),
        gainAtCap: noGain,
      })
    ).toEqual({ kind: "unknown" })
  })
})

describe("projectQuest", () => {
  const battles = Array.from(
    { length: 17 },
    (_, index) =>
      ({
        number: index + 1,
        tier: "Common",
        objectives: [{ type: "NotTrait", target: "Psyker", score: 100 }],
      }) as unknown as QuestBattle
  )
  const ready = (
    firstClears: boolean,
    secondClears: boolean | null
  ): QuestBattleEstimate => ({
    kind: "ready",
    required: 1,
    first: {
      power: 1,
      clears: firstClears,
      margin: 0,
      marginal: false,
      points: 500,
      objectives: [true],
    },
    second:
      secondClears === null
        ? null
        : {
            power: 1,
            clears: secondClears,
            margin: 0,
            marginal: false,
            points: 400,
            objectives: [false],
            team: team([{ unitId: "hero" }], 1),
            givenUp: [],
          },
    shortfall: null,
    capGains: [],
  })

  it("keeps entered scores and adds the clears the estimates project", () => {
    // Battles 1-10 entered for 4,600 points and 28 medals.
    const entries = Object.fromEntries(
      battles.slice(0, 10).map((battle, index) => [
        battle.number,
        {
          medals: index < 8 ? 3 : 2,
          lightning: 100,
          objectives: [index < 8],
        },
      ])
    )
    const estimates = new Map<number, QuestBattleEstimate>([
      ...battles
        .slice(0, 15)
        .map((battle) => [battle.number, ready(true, null)] as const),
      [16, ready(false, true)],
      [17, ready(false, false)],
    ])
    const projection = projectQuest(battles, entries, estimates, [])

    const entered = projectQuest(battles, entries, new Map(), [])
    expect(entered.score.total).toBe(4600)
    expect(entered.medals).toBe(28)
    expect(projection.score.total).toBe(4600 + 5 * 500 + 400)
    expect(projection.medals).toBe(28 + 18)
  })
})

describe("calibrateQuestPowerRatio", () => {
  const sample = (E: number, cleared: boolean) => ({ E, B: 100, cleared })

  it("needs at least 5 samples", () => {
    expect(
      calibrateQuestPowerRatio([1, 2, 3, 4].map((E) => sample(E * 100, true)))
    ).toBeNull()
  })

  it("bounds the ratio by the weakest clear when every sample cleared", () => {
    expect(
      calibrateQuestPowerRatio(
        [90, 120, 150, 200, 300].map((E) => sample(E, true))
      )
    ).toBeCloseTo(0.9)
  })

  it("lands between the strongest failure and the weakest clear", () => {
    const ratio = calibrateQuestPowerRatio([
      sample(70, false),
      sample(80, false),
      sample(110, true),
      sample(130, true),
      sample(150, true),
    ])
    expect(ratio).toBeGreaterThan(0.8)
    expect(ratio).toBeLessThanOrEqual(1.1)
  })
})

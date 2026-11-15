import { describe, expect, it } from "vitest"
import {
  hreFixture,
  progressionRulesFixture,
} from "@workspace/game-catalog/testing"

import { toHreRules } from "./hre-rules"

const progression = [progressionRulesFixture]
const weirdboy = hreFixture[0]!
const rules = toHreRules(hreFixture, progression, "orksWeirdboy")!

describe("toHreRules", () => {
  it("reads the 20 paid missions and the Bonus in the game's order", () => {
    expect(rules.missions).toHaveLength(21)
    expect(rules.missions[0]).toEqual({
      number: 1,
      bonus: false,
      currency: 100,
      objectives: [
        { kind: "lightningVictories", target: 2 },
        { kind: "killWithMelee", target: 5 },
      ],
    })
    expect(rules.missions[6]?.objectives).toEqual([
      { kind: "useAbilitiesAlliance", target: 20 },
      { kind: "salvageRuns", target: 2 },
    ])
    expect(rules.missions[8]?.objectives[0]).toEqual({
      kind: "damageType",
      target: 7500,
      qualifier: "Psychic",
    })
    expect(rules.missions[10]?.objectives[1]).toEqual({
      kind: "killFaction",
      target: 100,
      qualifier: "Necrons",
    })
    expect(rules.missions[11]?.objectives[1]).toEqual({
      kind: "onslaught",
      target: 1,
    })
    expect(rules.missions[20]).toMatchObject({
      number: 21,
      bonus: true,
      currency: 0,
      objectives: [
        { kind: "featuredDamage", target: 15_000 },
        { kind: "campaignWins", target: 250 },
      ],
    })
  })

  it("sums the milestones into the wiki's cumulative ladder", () => {
    const { milestones } = rules.rewards
    expect(milestones).toHaveLength(36)
    expect(milestones[0]).toEqual({ points: 100, cumulative: 55 })
    expect(milestones[13]).toEqual({ points: 10_000, cumulative: 1415 })
    expect(milestones.at(-1)).toEqual({ points: 1_000_000, cumulative: 6090 })
  })

  it("brackets the leaderboard by last position with both weeks' crates", () => {
    const { brackets } = rules.rewards
    expect(brackets).toHaveLength(25)
    expect(brackets[0]).toEqual({
      upTo: 1,
      daily: 100,
      week1: { currency: 550, shards: 33 },
      week2: { currency: 1100, shards: 66 },
    })
    expect(brackets[3]).toMatchObject({ upTo: 10, daily: 89 })
    expect(brackets.at(-1)).toEqual({
      upTo: Infinity,
      daily: 20,
      week1: { currency: 110, shards: 3 },
      week2: { currency: 220, shards: 6 },
    })
  })

  it("reads the chest shop, the mission currency and the step shards", () => {
    const { chests, missionCurrency, paidMissions, steps } = rules.rewards
    expect(chests).toHaveLength(28)
    expect(chests[0]).toEqual({ cost: 100, shards: 10 })
    expect(chests.at(-1)).toEqual({ cost: 5000, shards: 40 })
    expect([missionCurrency, paidMissions]).toEqual([2000, 20])
    expect(steps.map((step) => step.shards)).toEqual([
      25, 50, 75, 100, 150, 210, 280, 330, 390, 460, 510, 570, 670, 770, 970,
      1370,
    ])
    expect(steps.find((step) => step.id === "rare-4")).toMatchObject({
      unlockFor: "Rare",
    })
  })

  it("falls back to the latest event for a hero without one", () => {
    const fallback = toHreRules(hreFixture, progression, "newHero")
    expect(fallback?.missions).toEqual(
      toHreRules(hreFixture, progression, "astarEradicator")?.missions
    )
  })

  it("is unavailable for a task the tracker does not know", () => {
    const [first, ...rest] = weirdboy.missions
    const unknown = {
      ...weirdboy,
      missions: [
        {
          ...first!,
          tasks: [
            { name: "WinWithoutMoving", target: 1, parameters: {} },
            first!.tasks[1]!,
          ],
        },
        ...rest,
      ],
    }
    expect(toHreRules([unknown], progression, "orksWeirdboy")).toBeUndefined()
    expect(toHreRules(hreFixture, [], "orksWeirdboy")).toBeUndefined()
  })
})

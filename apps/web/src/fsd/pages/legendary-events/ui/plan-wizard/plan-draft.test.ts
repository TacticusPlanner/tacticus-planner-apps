import { describe, expect, it } from "vitest"

import type {
  LegendaryEventRosterUnit,
  UpgradeStep,
} from "@/entities/legendary-event"

import type { StepTarget } from "./plan-ceiling"
import {
  goalChains,
  newSuggestionKeys,
  recommendationKey,
  recommendationsFor,
  targetOptions,
  toggleRecommendation,
} from "./plan-draft"
import type { UpgradeRecommendation } from "./plan-upgrades"

const unit = (
  unitId: string,
  overrides: Partial<LegendaryEventRosterUnit> = {}
): LegendaryEventRosterUnit => ({
  unitId: unitId as LegendaryEventRosterUnit["unitId"],
  rank: "Gold1",
  progressionIndex: "Epic:RedOneStar",
  ...overrides,
})

const rankStep = (unitId: string, rank: "Gold2" | "Gold3"): UpgradeStep => ({
  kind: "rank",
  rank,
  unit: unit(unitId, { rank }),
})

const recommendation = (
  unitId: string,
  ceilingAfter: number,
  steps: UpgradeStep[] = [rankStep(unitId, "Gold2")],
  alreadyPlanned = false
): UpgradeRecommendation => ({
  unitId,
  steps,
  farmingDays: 5,
  readyMs: 0,
  firstRun: 3,
  gain: 100,
  ceilingAfter,
  alreadyPlanned,
})

const points = (value: number): StepTarget => ({
  step: "fourStars",
  kind: "points",
  points: value,
})

const never = () => false

const LIST = [
  recommendation("calgar", 1100),
  recommendation("dante", 1300),
  recommendation("calgar", 1500, [rankStep("calgar", "Gold3")]),
]

describe("recommendationsFor", () => {
  it("needs none when the synced roster already reaches the target", () => {
    expect(recommendationsFor(LIST, points(900), 1000)).toBe(0)
  })

  it("takes the prefix up to the first recommendation that reaches the target", () => {
    expect(recommendationsFor(LIST, points(1250), 1000)).toBe(2)
  })

  it("takes every recommendation when none reaches the target", () => {
    expect(recommendationsFor(LIST, points(5000), 1000)).toBe(3)
    expect(
      recommendationsFor(LIST, { step: "mythic", kind: "unreachable" }, 1000)
    ).toBe(3)
  })
})

describe("toggleRecommendation", () => {
  it("ticks a unit's earlier recommendations with a later one", () => {
    expect([...toggleRecommendation(LIST, new Set(), 2)].sort()).toEqual([0, 2])
  })

  it("unticks a unit's later recommendations with an earlier one", () => {
    expect([...toggleRecommendation(LIST, new Set([0, 1, 2]), 0)]).toEqual([1])
  })
})

describe("goalChains", () => {
  it("groups the ticked recommendations by unit with the end rank", () => {
    const chains = goalChains(LIST, new Set([0, 1, 2]), [unit("calgar")], never)
    expect(chains.map((chain) => chain.unitId)).toEqual(["calgar", "dante"])
    expect(chains[0]!.steps).toHaveLength(2)
    expect(chains[0]!.request).toMatchObject({
      unitId: "calgar",
      rankEnd: "Gold3",
    })
    expect(chains[0]!.from?.unitId).toBe("calgar")
    expect(chains[1]!.from).toBeUndefined()
  })

  it("starts a chain after the steps an Active goal already covers", () => {
    const covered = (_unitId: string, step: UpgradeStep) =>
      step.kind === "rank" && step.rank === "Gold2"
    const [calgar] = goalChains(
      LIST,
      new Set([0, 2]),
      [unit("calgar")],
      covered
    )
    expect(calgar!.steps).toHaveLength(1)
    expect(calgar!.from?.rank).toBe("Gold2")
    expect(calgar!.request).toMatchObject({ rankEnd: "Gold3" })
    expect(calgar!.alreadyPlanned).toBe(false)
    expect(goalChains(LIST, new Set([0]), [], covered)[0]!.alreadyPlanned).toBe(
      true
    )
  })
})

describe("recommendationKey", () => {
  it("names a recommendation by its unit and step targets", () => {
    expect(LIST.map(recommendationKey)).toEqual([
      "calgar:Gold2",
      "dante:Gold2",
      "calgar:Gold3",
    ])
  })
})

describe("targetOptions", () => {
  it("gives each step a verdict and the highest step within reach", () => {
    const { options, best } = targetOptions(
      [
        points(900),
        { step: "fiveStars", kind: "points", points: 1400 },
        { step: "blueStar", kind: "points", points: 3000 },
      ],
      1000,
      1500
    )
    expect(options.map((option) => option.verdict.kind)).toEqual([
      "reachableNow",
      "needsUpgrades",
      "tooAmbitious",
    ])
    expect(best).toBe("fiveStars")
  })
})

describe("newSuggestionKeys", () => {
  it("lists the finds after the last manual tick that are not ticked", () => {
    // The user unticked b while a, b and c were found; d and e came later.
    const seen = new Set(["a", "b", "c"])
    const ticked = new Set(["a", "c"])
    expect(newSuggestionKeys(["a", "b", "c", "d", "e"], seen, ticked)).toEqual([
      "d",
      "e",
    ])
  })

  it("has none while the default ticks follow the search", () => {
    expect(newSuggestionKeys(["a", "b"], new Set(), null)).toEqual([])
  })
})

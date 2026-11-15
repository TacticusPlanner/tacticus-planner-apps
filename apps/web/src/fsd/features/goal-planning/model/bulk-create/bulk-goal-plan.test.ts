import { describe, expect, it } from "vitest"
import type { UnitId } from "@workspace/game-domain"

import type { GoalDetail } from "@/entities/goal"

import {
  buildBulkGoalPlans,
  buildUnitPlan,
  bulkPlanTypesOverLimit,
  type BulkGoalTargets,
  type BulkGoalUnit,
} from "./bulk-goal-plan"

const NONE: BulkGoalTargets = {
  unlock: true,
  ascension: null,
  rank: null,
  ability: null,
}

const ragnar: BulkGoalUnit = {
  kind: "character",
  unitId: "spaceRagnar" as UnitId,
  name: "Ragnar",
  owned: true,
  progression: "Legendary:RedThreeStars",
  rank: "Gold1",
  abilityLevels: [30, 28],
}
const tigurius: BulkGoalUnit = {
  kind: "character",
  unitId: "ultraTigurius" as UnitId,
  name: "Tigurius",
  owned: true,
  progression: "Epic:RedOneStar",
  rank: "Silver3",
  abilityLevels: [20, 20],
}
const galatian: BulkGoalUnit = {
  kind: "mow",
  unitId: "adeptaGalatian" as UnitId,
  name: "Galatian",
  owned: true,
  progression: "Rare:FourStars",
  abilityLevels: [10, 10],
}
const morvenn: BulkGoalUnit = {
  kind: "character",
  unitId: "adeptaMorvenn" as UnitId,
  name: "Morvenn",
  owned: false,
  startProgression: "Legendary:RedThreeStars",
}

function goal(
  partial: Pick<GoalDetail, "goalType" | "entityId"> &
    Partial<Omit<GoalDetail, "config">> & {
      config?: Partial<GoalDetail["config"]>
    }
): GoalDetail {
  return {
    goalId: `${partial.entityId}-${partial.goalType}`,
    entityType: "Character",
    status: "Active",
    globalPriority: 1,
    notes: null,
    createdAt: "",
    updatedAt: "",
    snapshot: null,
    events: [],
    dependsOn: [],
    projectIds: [],
    revision: 1,
    ...partial,
    config: {
      rank: null,
      progression: null,
      ability: null,
      farmingStrategy: "TotalUpgrades",
      acquisitionSources: null,
      farmingLocationIds: null,
      upgrade: null,
      ...partial.config,
    },
  } as GoalDetail
}

describe("buildUnitPlan", () => {
  it("plans one Rank goal when the rarity already allows the target", () => {
    const plan = buildUnitPlan(ragnar, { ...NONE, rank: "Diamond1" }, [])
    expect(plan.goals).toEqual([
      { goalType: "Rank", start: "Gold1", end: "Diamond1" },
    ])
    expect(plan.specs).toEqual([
      {
        goalType: "Rank",
        config: {
          farmingStrategy: "TotalUpgrades",
          rank: {
            start: 12,
            startPointFive: false,
            startAppliedUpgrades: 0,
            end: 15,
            endPointFive: false,
            endAppliedUpgrades: 0,
          },
        },
        dependsOnIndex: [],
      },
    ])
  })

  it("adds the Ascension a Rank target above the rarity cap needs", () => {
    // Epic tops out at Gold I; Diamond I needs Legendary (three red stars).
    const plan = buildUnitPlan(tigurius, { ...NONE, rank: "Diamond1" }, [])
    expect(plan.goals).toEqual([
      {
        goalType: "Ascension",
        start: "Epic:RedOneStar",
        end: "Legendary:RedThreeStars",
        added: true,
      },
      { goalType: "Rank", start: "Silver3", end: "Diamond1" },
    ])
    expect(plan.specs.map((spec) => spec.dependsOnIndex)).toEqual([[], [0]])
  })

  it("depends on the chosen Ascension when it reaches far enough", () => {
    const plan = buildUnitPlan(
      tigurius,
      { ...NONE, ascension: "Legendary:RedFourStars", rank: "Diamond1" },
      []
    )
    expect(plan.goals.map((g) => g.goalType)).toEqual(["Ascension", "Rank"])
    expect(plan.goals[0]).toMatchObject({ added: false })
    expect(plan.specs[1]?.dependsOnIndex).toEqual([0])
  })

  it("adds a second Ascension when the chosen one stops short", () => {
    const plan = buildUnitPlan(
      tigurius,
      { ...NONE, ascension: "Epic:RedTwoStars", rank: "Diamond1" },
      []
    )
    expect(plan.goals).toMatchObject([
      { goalType: "Ascension", end: "Epic:RedTwoStars", added: false },
      { goalType: "Ascension", end: "Legendary:RedThreeStars", added: true },
      { goalType: "Rank" },
    ])
    expect(plan.specs.map((spec) => spec.dependsOnIndex)).toEqual([
      [],
      [0],
      [1],
    ])
  })

  it("depends on an in-flight Ascension goal that already reaches the need", () => {
    const existing = [
      goal({
        goalType: "Ascension",
        entityId: "ultraTigurius",
        goalId: "asc-1",
        config: {
          progression: {
            start: "Epic:RedOneStar",
            end: "Legendary:RedThreeStars",
          },
        },
      }),
    ]
    const plan = buildUnitPlan(
      tigurius,
      { ...NONE, rank: "Diamond1" },
      existing
    )
    expect(plan.goals.map((g) => g.goalType)).toEqual(["Rank"])
    expect(plan.specs[0]).toMatchObject({
      dependsOnIndex: [],
      dependsOnGoalIds: ["asc-1"],
    })
  })

  it("skips targets already reached, already a goal, or not for a Machine of War", () => {
    const existing = [
      goal({
        goalType: "Rank",
        entityId: "spaceRagnar",
        config: {
          rank: {
            start: 12,
            startPointFive: false,
            startAppliedUpgrades: 0,
            end: 15,
            endPointFive: false,
            endAppliedUpgrades: 0,
          },
        },
      }),
    ]
    expect(
      buildUnitPlan(ragnar, { ...NONE, rank: "Diamond1" }, existing).skipped
    ).toEqual([{ goalType: "Rank", reason: "alreadyGoal" }])
    expect(
      buildUnitPlan(ragnar, { ...NONE, rank: "Bronze1" }, []).skipped
    ).toEqual([{ goalType: "Rank", reason: "reached" }])
    const mow = buildUnitPlan(galatian, { ...NONE, rank: "Diamond1" }, [])
    expect(mow.skipped).toEqual([{ goalType: "Rank", reason: "notForMow" }])
    expect(mow.specs).toEqual([])
  })

  it("raises both ability tracks, keeping one already there", () => {
    const plan = buildUnitPlan(ragnar, { ...NONE, ability: 29 }, [])
    expect(plan.goals).toEqual([
      {
        goalType: "Ability",
        activeStart: 30,
        activeEnd: 30,
        passiveStart: 28,
        passiveEnd: 29,
      },
    ])
    expect(buildUnitPlan(ragnar, { ...NONE, ability: 28 }, []).skipped).toEqual(
      [{ goalType: "Ability", reason: "reached" }]
    )
  })

  it("adds one Ascension for the highest of Rank and Abilities needs", () => {
    // Abilities 40 needs Legendary; Rank Gold I fits Epic.
    const plan = buildUnitPlan(
      tigurius,
      { ...NONE, rank: "Gold1", ability: 40 },
      []
    )
    expect(plan.goals).toMatchObject([
      { goalType: "Rank", end: "Gold1" },
      { goalType: "Ascension", end: "Legendary:RedThreeStars", added: true },
      { goalType: "Ability", activeEnd: 40, passiveEnd: 40 },
    ])
    expect(plan.specs.map((spec) => spec.dependsOnIndex)).toEqual([[], [], [1]])
  })

  it("unlocks a unit not owned and starts its targets from its starting values", () => {
    const plan = buildUnitPlan(morvenn, { ...NONE, rank: "Diamond1" }, [])
    expect(plan.goals).toEqual([
      { goalType: "Unlock" },
      { goalType: "Rank", start: "Stone1", end: "Diamond1" },
    ])
    expect(plan.specs.map((spec) => spec.dependsOnIndex)).toEqual([[], [0]])
  })

  it("skips a unit not owned when Unlock is off", () => {
    const plan = buildUnitPlan(
      morvenn,
      { ...NONE, unlock: false, rank: "Diamond1" },
      []
    )
    expect(plan.specs).toEqual([])
    expect(plan.skipped).toEqual([{ goalType: "Unlock", reason: "notOwned" }])
  })

  it("depends on an in-flight Unlock goal instead of adding one", () => {
    const existing = [
      goal({ goalType: "Unlock", entityId: "adeptaMorvenn", goalId: "u-1" }),
    ]
    const plan = buildUnitPlan(morvenn, { ...NONE, ability: 10 }, existing)
    expect(plan.goals.map((g) => g.goalType)).toEqual(["Ability"])
    expect(plan.skipped).toEqual([
      { goalType: "Unlock", reason: "alreadyGoal" },
    ])
    expect(plan.specs[0]).toMatchObject({
      dependsOnIndex: [],
      dependsOnGoalIds: ["u-1"],
    })
  })
})

describe("buildBulkGoalPlans", () => {
  it("reads only each unit's in-flight goals", () => {
    const goals = [
      goal({
        goalType: "Ascension",
        entityId: "ultraTigurius",
        status: "Completed",
        config: {
          progression: {
            start: "Epic:RedOneStar",
            end: "Legendary:RedThreeStars",
          },
        },
      }),
    ]
    const [plan] = buildBulkGoalPlans(
      [tigurius],
      { ...NONE, rank: "Diamond1" },
      goals
    )
    expect(plan?.goals[0]).toMatchObject({ goalType: "Ascension", added: true })
  })
})

describe("bulkPlanTypesOverLimit", () => {
  it("names a type the plans would push past 200", () => {
    const existing = Array.from({ length: 199 }, (_, index) =>
      goal({ goalType: "Rank", entityId: `u${index}`, goalId: `g${index}` })
    )
    const plans = buildBulkGoalPlans(
      [ragnar, tigurius],
      { ...NONE, rank: "Gold2" },
      []
    )
    expect(bulkPlanTypesOverLimit(plans, existing)).toEqual(["Rank"])
  })
})

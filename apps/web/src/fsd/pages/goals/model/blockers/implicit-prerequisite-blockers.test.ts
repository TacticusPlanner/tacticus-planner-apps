import { describe, expect, it } from "vitest"

import type { GoalDetail } from "@/entities/goal"
import { implicitPrerequisiteBlockers } from ".//implicit-prerequisite-blockers"

function abilityGoal(
  entityType: "Character" | "Mow" = "Character"
): GoalDetail {
  return {
    goalId: "ability-goal",
    entityType,
    entityId: "unit-1",
    goalType: "Ability",
    status: "Active",
    notes: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    projectIds: ["project-1"],
    dependsOn: [],
    events: [],
    snapshot: null,
    config: {
      ability: {
        activeStart: 1,
        activeEnd: 20,
        passiveStart: 1,
        passiveEnd: 1,
      },
    },
  } as unknown as GoalDetail
}

function prerequisiteGoal(
  goalType: "Level" | "Ascension",
  status: "Active" | "Archived" = "Active"
): GoalDetail {
  return {
    ...abilityGoal(),
    goalId: `${goalType}-goal`,
    goalType,
    status,
    config:
      goalType === "Level"
        ? { level: { start: 1, end: 20 } }
        : {
            progression: {
              start: "Common:None",
              end: "Rare:FourStars",
            },
          },
  } as unknown as GoalDetail
}

describe("implicitPrerequisiteBlockers", () => {
  it("derives both Level and Ascension gaps for Character abilities", () => {
    const reasons = implicitPrerequisiteBlockers({
      detail: abilityGoal(),
      playerUnit: { xpLevel: 10, progressionIndex: "Common:None" },
      prerequisiteGoals: [],
      ready: true,
    })

    expect(reasons).toEqual([
      {
        kind: "MissingLevelPrerequisite",
        requiredLevel: 20,
        existingGoalId: undefined,
      },
      {
        kind: "MissingAscensionPrerequisite",
        requiredProgression: "Rare:FourStars",
        existingGoalId: undefined,
      },
    ])
  })

  it("does not apply a Level prerequisite to a Machine of War ability", () => {
    const reasons = implicitPrerequisiteBlockers({
      detail: abilityGoal("Mow"),
      playerUnit: { xpLevel: 1, progressionIndex: "Common:None" },
      prerequisiteGoals: [],
      ready: true,
    })

    expect(reasons.map((reason) => reason.kind)).toEqual([
      "MissingAscensionPrerequisite",
    ])
  })

  it("accepts covering global goals and ignores archived coverage", () => {
    const params = {
      detail: abilityGoal(),
      playerUnit: { xpLevel: 10, progressionIndex: "Common:None" },
      ready: true,
    }
    expect(
      implicitPrerequisiteBlockers({
        ...params,
        prerequisiteGoals: [
          prerequisiteGoal("Level"),
          prerequisiteGoal("Ascension"),
        ],
      })
    ).toEqual([])

    expect(
      implicitPrerequisiteBlockers({
        ...params,
        prerequisiteGoals: [prerequisiteGoal("Level", "Archived")],
      }).map((reason) => reason.kind)
    ).toEqual(["MissingLevelPrerequisite", "MissingAscensionPrerequisite"])
  })

  it("links an inadequate active prerequisite and waits for loaded inputs", () => {
    const inadequate = prerequisiteGoal("Level")
    inadequate.config.level = { start: 1, end: 15 }
    expect(
      implicitPrerequisiteBlockers({
        detail: abilityGoal(),
        playerUnit: { xpLevel: 10, progressionIndex: "Common:None" },
        prerequisiteGoals: [inadequate],
        ready: true,
      })[0]
    ).toMatchObject({
      kind: "MissingLevelPrerequisite",
      existingGoalId: "Level-goal",
    })
    expect(
      implicitPrerequisiteBlockers({
        detail: abilityGoal(),
        playerUnit: { xpLevel: 10, progressionIndex: "Common:None" },
        prerequisiteGoals: [],
        ready: false,
      })
    ).toEqual([])
  })
})

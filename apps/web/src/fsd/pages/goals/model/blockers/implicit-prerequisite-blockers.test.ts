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
  status: "Active" | "Archived" = "Active",
  end = "Rare:FourStars"
): GoalDetail {
  return {
    ...abilityGoal(),
    goalId: "Ascension-goal",
    goalType: "Ascension",
    status,
    config: { progression: { start: "Common:None", end } },
  } as unknown as GoalDetail
}

describe("implicitPrerequisiteBlockers", () => {
  it("derives only the Ascension gap for a Character ability — routine leveling is never a reason", () => {
    const reasons = implicitPrerequisiteBlockers({
      detail: abilityGoal(),
      playerUnit: { xpLevel: 10, progressionIndex: "Common:None" },
      prerequisiteGoals: [],
      ready: true,
      unitName: "Test Unit",
    })

    expect(reasons).toEqual([
      {
        kind: "MissingAscensionPrerequisite",
        requiredProgression: "Rare:FourStars",
        existingGoalId: undefined,
      },
    ])
  })

  it("reports nothing when only routine leveling remains", () => {
    expect(
      implicitPrerequisiteBlockers({
        detail: abilityGoal(),
        // Level 10 is far below the level-20 target, but the rarity already permits it.
        playerUnit: { xpLevel: 10, progressionIndex: "Rare:FourStars" },
        prerequisiteGoals: [],
        ready: true,
        unitName: "Test Unit",
      })
    ).toEqual([])
  })

  it("reports the same Ascension gap for a Machine of War ability", () => {
    const reasons = implicitPrerequisiteBlockers({
      detail: abilityGoal("Mow"),
      playerUnit: { xpLevel: 1, progressionIndex: "Common:None" },
      prerequisiteGoals: [],
      ready: true,
      unitName: "Test Unit",
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
      unitName: "Test Unit",
    }
    expect(
      implicitPrerequisiteBlockers({
        ...params,
        prerequisiteGoals: [prerequisiteGoal()],
      })
    ).toEqual([])

    expect(
      implicitPrerequisiteBlockers({
        ...params,
        prerequisiteGoals: [prerequisiteGoal("Archived")],
      }).map((reason) => reason.kind)
    ).toEqual(["MissingAscensionPrerequisite"])
  })

  it("links an inadequate active prerequisite and waits for loaded inputs", () => {
    const inadequate = prerequisiteGoal("Active", "Common:TwoStars")
    expect(
      implicitPrerequisiteBlockers({
        detail: abilityGoal(),
        playerUnit: { xpLevel: 10, progressionIndex: "Common:None" },
        prerequisiteGoals: [inadequate],
        ready: true,
        unitName: "Test Unit",
      })[0]
    ).toMatchObject({
      kind: "MissingAscensionPrerequisite",
      existingGoalId: "Ascension-goal",
    })
    expect(
      implicitPrerequisiteBlockers({
        detail: abilityGoal(),
        playerUnit: { xpLevel: 10, progressionIndex: "Common:None" },
        prerequisiteGoals: [],
        ready: false,
        unitName: "Test Unit",
      })
    ).toEqual([])
  })

  it("reports a missing-Unlock reason for a loaded roster without the unit (1.1/1.2)", () => {
    const reasons = implicitPrerequisiteBlockers({
      detail: abilityGoal(),
      playerUnit: undefined,
      prerequisiteGoals: [],
      ready: true,
      unitName: "Bellator",
    })

    expect(reasons).toEqual([
      { kind: "MissingUnlockPrerequisite", unitName: "Bellator" },
    ])
  })

  it("does not report a missing-Unlock reason while data is still loading", () => {
    expect(
      implicitPrerequisiteBlockers({
        detail: abilityGoal(),
        playerUnit: undefined,
        prerequisiteGoals: [],
        ready: false,
        unitName: "Bellator",
      })
    ).toEqual([])
  })

  it("never reports a missing-Unlock reason for an Unlock goal on its own unit", () => {
    const unlockGoal: GoalDetail = {
      ...abilityGoal(),
      goalType: "Unlock",
      config: {} as never,
    }

    expect(
      implicitPrerequisiteBlockers({
        detail: unlockGoal,
        playerUnit: undefined,
        prerequisiteGoals: [],
        ready: true,
        unitName: "Bellator",
      })
    ).toEqual([])
  })

  it("suppresses the missing-Unlock reason when the plan has a non-archived Unlock goal for the unit", () => {
    const coveringUnlock = prerequisiteGoal()
    coveringUnlock.goalId = "unlock-goal"
    coveringUnlock.goalType = "Unlock"
    coveringUnlock.status = "Active"

    expect(
      implicitPrerequisiteBlockers({
        detail: abilityGoal(),
        playerUnit: undefined,
        prerequisiteGoals: [coveringUnlock],
        ready: true,
        unitName: "Bellator",
      })
    ).toEqual([])
  })

  it("does not suppress the missing-Unlock reason when the only Unlock goal is archived", () => {
    const archivedUnlock = prerequisiteGoal("Archived")
    archivedUnlock.goalId = "unlock-goal"
    archivedUnlock.goalType = "Unlock"

    expect(
      implicitPrerequisiteBlockers({
        detail: abilityGoal(),
        playerUnit: undefined,
        prerequisiteGoals: [archivedUnlock],
        ready: true,
        unitName: "Bellator",
      })
    ).toEqual([{ kind: "MissingUnlockPrerequisite", unitName: "Bellator" }])
  })
})

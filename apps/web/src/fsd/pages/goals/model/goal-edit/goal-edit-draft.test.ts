import { describe, expect, it } from "vitest"
import { Rank, rankIndex } from "@workspace/game-domain"

import type { GoalConfig, GoalDetail } from "@/entities/goal"

import {
  baselineGoalEditDraft,
  buildEditGoalRequest,
  goalEditChanges,
  isGoalEditDirty,
  normalizeAcquisitionSources,
  type GoalEditDraft,
} from "./goal-edit-draft"

const emptyConfig: GoalConfig = {
  rank: null,
  progression: null,
  ability: null,
  farmingStrategy: "TotalUpgrades",
  acquisitionSources: null,
  farmingLocationIds: null,
  upgrade: null,
}

function goal(
  goalType: GoalDetail["goalType"],
  config: Partial<GoalConfig> = {}
): GoalDetail {
  return {
    goalId: "goal-1",
    entityType: "Character",
    entityId: "hero",
    goalType,
    status: "Active",
    notes: "Old note",
    dependsOn: [],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    globalPriority: 3,
    config: { ...emptyConfig, ...config },
    snapshot: null,
    events: [],
    projectIds: ["project-1"],
    revision: 7,
  }
}

const rankGoal = goal("Rank", {
  rank: {
    start: rankIndex(Rank.Silver1),
    startPointFive: false,
    startAppliedUpgrades: 0,
    end: rankIndex(Rank.Gold1),
    endPointFive: false,
    endAppliedUpgrades: 0,
  },
})

const base = (detail: GoalDetail): GoalEditDraft =>
  baselineGoalEditDraft(detail, {
    acquisitionSources: null,
    priorityPosition: 3,
  })

describe("goal edit draft", () => {
  it("starts unchanged at the loaded goal", () => {
    const baseline = base(rankGoal)

    expect(isGoalEditDirty(goalEditChanges(baseline, baseline))).toBe(false)
    expect(baseline).toMatchObject({
      notes: "Old note",
      projectIds: ["project-1"],
      priorityPosition: 3,
    })
  })

  it("marks only the target changed when the target differs", () => {
    const baseline = base(rankGoal)
    const draft: GoalEditDraft = {
      ...baseline,
      target: { ...baseline.target!, end: Rank.Gold2 } as never,
    }

    expect(goalEditChanges(baseline, draft)).toEqual({
      target: true,
      details: false,
      projects: false,
      priority: false,
    })
  })

  it.each([
    ["notes", (d: GoalEditDraft) => ({ ...d, notes: "New note" })],
    [
      "strategy",
      (d: GoalEditDraft) => ({ ...d, farmingStrategy: "Milestones" }),
    ],
    [
      "locations",
      (d: GoalEditDraft) => ({ ...d, farmingLocationIds: ["battle-1"] }),
    ],
    [
      "sources",
      (d: GoalEditDraft) => ({
        ...d,
        acquisitionSources: [{ kind: "Campaign", ids: ["b1"] }],
      }),
    ],
  ] as const)("marks details changed by %s", (_, change) => {
    const baseline = base(rankGoal)

    expect(
      goalEditChanges(baseline, change(baseline) as GoalEditDraft)
    ).toMatchObject({ details: true, target: false })
  })

  it("ignores whitespace-only note differences and source order", () => {
    const baseline = baselineGoalEditDraft(rankGoal, {
      acquisitionSources: [
        { kind: "Campaign", ids: ["b2", "b1"] },
        { kind: "Onslaught", ids: [] },
      ],
      priorityPosition: 3,
    })
    const draft: GoalEditDraft = {
      ...baseline,
      notes: "Old note  ",
      acquisitionSources: [
        { kind: "Onslaught", ids: [] },
        { kind: "Campaign", ids: ["b1", "b2"] },
      ],
    }

    expect(isGoalEditDirty(goalEditChanges(baseline, draft))).toBe(false)
    expect(normalizeAcquisitionSources(null)).toBe("[]")
  })

  it("marks projects changed by add, remove, and swap but not reorder", () => {
    const baseline = base({ ...rankGoal, projectIds: ["a", "b"] })
    const changed = (projectIds: string[]) =>
      goalEditChanges(baseline, { ...baseline, projectIds }).projects

    expect(changed(["b", "a"])).toBe(false)
    expect(changed(["a"])).toBe(true)
    expect(changed(["a", "b", "c"])).toBe(true)
    expect(changed(["a", "c"])).toBe(true)
  })

  it("marks priority changed only by a different position", () => {
    const baseline = base(rankGoal)

    expect(
      goalEditChanges(baseline, { ...baseline, priorityPosition: 3 }).priority
    ).toBe(false)
    expect(
      goalEditChanges(baseline, { ...baseline, priorityPosition: 1 }).priority
    ).toBe(true)
  })
})

describe("buildEditGoalRequest", () => {
  it("sends only the changed sections, with the loaded revision and order revision", () => {
    const baseline = base(rankGoal)
    const draft: GoalEditDraft = {
      ...baseline,
      target: { ...baseline.target!, end: Rank.Gold2 } as never,
      priorityPosition: 1,
    }
    const request = buildEditGoalRequest(
      rankGoal,
      draft,
      goalEditChanges(baseline, draft),
      12
    )

    expect(Object.keys(request).sort()).toEqual(["priority", "target"])
    expect(request.target?.expectedRevision).toBe(7)
    expect(request.priority).toEqual({
      position: 1,
      expectedOrderRevision: 12,
    })
  })

  it("clears the location override for Rank goals and empties notes to null", () => {
    const baseline = base(rankGoal)
    const draft: GoalEditDraft = { ...baseline, notes: "   " }
    const request = buildEditGoalRequest(
      rankGoal,
      draft,
      goalEditChanges(baseline, draft),
      1
    )

    expect(request).toEqual({
      details: {
        notes: null,
        farmingLocationIds: null,
        farmingStrategy: "TotalUpgrades",
        acquisitionSources: undefined,
      },
    })
  })

  it("sends chosen locations for kinds that keep them and the source list for Unlock", () => {
    const ability = goal("Ability")
    const abilityBase = base(ability)
    const abilityDraft = { ...abilityBase, farmingLocationIds: ["b1"] }
    expect(
      buildEditGoalRequest(
        ability,
        abilityDraft,
        goalEditChanges(abilityBase, abilityDraft),
        1
      ).details?.farmingLocationIds
    ).toEqual(["b1"])

    const unlock = goal("Unlock")
    const unlockBase = baselineGoalEditDraft(unlock, {
      acquisitionSources: [{ kind: "Campaign", ids: ["b1"] }],
      priorityPosition: 3,
    })
    const unlockDraft = { ...unlockBase, notes: "x" }
    const details = buildEditGoalRequest(
      unlock,
      unlockDraft,
      goalEditChanges(unlockBase, unlockDraft),
      1
    ).details
    expect(details?.farmingLocationIds).toBeNull()
    expect(details?.acquisitionSources).toEqual([
      { kind: "Campaign", ids: ["b1"] },
    ])
  })

  it("sends the replacement project list", () => {
    const baseline = base(rankGoal)
    const draft = { ...baseline, projectIds: ["project-1", "project-2"] }

    expect(
      buildEditGoalRequest(rankGoal, draft, goalEditChanges(baseline, draft), 1)
    ).toEqual({ projectIds: ["project-1", "project-2"] })
  })
})

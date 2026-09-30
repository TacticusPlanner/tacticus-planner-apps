import type {
  AcquisitionSource,
  EditGoalRequest,
  FarmingStrategy,
  GoalDetail,
} from "@/entities/goal"

import {
  goalTargetDraftFromDetail,
  goalTargetEditFromDraft,
  isGoalTargetEditable,
  type GoalTargetDraft,
} from "../target-edit/goal-target-edit"

/** Everything the Edit goal dialog lets the owner change, held as one draft. `null` means the goal has
 * no such field (an Unlock goal has no target, a Completed goal no position, only Unlock/Ascension have
 * acquisition sources). */
export type GoalEditDraft = {
  target: GoalTargetDraft | null
  notes: string
  farmingStrategy: FarmingStrategy
  farmingLocationIds: string[]
  acquisitionSources: AcquisitionSource[] | null
  projectIds: string[]
  /** 1-based position in the account-wide order of in-flight goals. */
  priorityPosition: number | null
}

/** Which request sections differ from the loaded goal — exactly the sections `editGoal` is sent. */
export type GoalEditChanges = {
  target: boolean
  details: boolean
  projects: boolean
  priority: boolean
}

/** Order-independent comparison key for an acquisition-source set — a saved goal's entry order and a
 * freshly-rebuilt plan's order aren't guaranteed to match even when the selection is identical. */
export function normalizeAcquisitionSources(
  sources: readonly AcquisitionSource[] | null
): string {
  return JSON.stringify(
    [...(sources ?? [])]
      .map((source) => ({ kind: source.kind, ids: [...source.ids].sort() }))
      .sort((a, b) => a.kind.localeCompare(b.kind))
  )
}

function hasSelectionChanged(
  current: readonly string[],
  next: readonly string[]
): boolean {
  return (
    current.length !== next.length || next.some((id) => !current.includes(id))
  )
}

/** The draft the dialog opens with: the goal as loaded. `acquisitionSources` and `priorityPosition` come
 * from outside the goal (the picker's baseline plan, the global order). */
export function baselineGoalEditDraft(
  detail: GoalDetail,
  extras: {
    acquisitionSources: AcquisitionSource[] | null
    priorityPosition: number | null
  }
): GoalEditDraft {
  return {
    target: isGoalTargetEditable(detail)
      ? goalTargetDraftFromDetail(detail)
      : null,
    notes: detail.notes ?? "",
    farmingStrategy: detail.config.farmingStrategy ?? "TotalUpgrades",
    farmingLocationIds: detail.config.farmingLocationIds ?? [],
    acquisitionSources: extras.acquisitionSources,
    projectIds: detail.projectIds,
    priorityPosition: extras.priorityPosition,
  }
}

export function goalEditChanges(
  baseline: GoalEditDraft,
  draft: GoalEditDraft
): GoalEditChanges {
  return {
    target: JSON.stringify(baseline.target) !== JSON.stringify(draft.target),
    details:
      draft.notes.trim() !== baseline.notes ||
      draft.farmingStrategy !== baseline.farmingStrategy ||
      hasSelectionChanged(
        baseline.farmingLocationIds,
        draft.farmingLocationIds
      ) ||
      normalizeAcquisitionSources(baseline.acquisitionSources) !==
        normalizeAcquisitionSources(draft.acquisitionSources),
    projects: hasSelectionChanged(baseline.projectIds, draft.projectIds),
    priority: baseline.priorityPosition !== draft.priorityPosition,
  }
}

export function isGoalEditDirty(changes: GoalEditChanges): boolean {
  return Object.values(changes).some(Boolean)
}

/**
 * The `editGoal` body: only the sections that changed. The target carries the loaded goal's revision;
 * priority carries the order revision the position was chosen against. Rank goals and goals with an
 * acquisition-source picker never keep a farming-location override, so those clear it.
 */
export function buildEditGoalRequest(
  detail: GoalDetail,
  draft: GoalEditDraft,
  changes: GoalEditChanges,
  orderRevision: number
): EditGoalRequest {
  const request: EditGoalRequest = {}
  if (changes.target && draft.target) {
    request.target = {
      expectedRevision: detail.revision,
      target: goalTargetEditFromDraft(draft.target),
    }
  }
  if (changes.details) {
    const clearsLocations =
      detail.goalType === "Rank" || draft.acquisitionSources !== null
    request.details = {
      notes: draft.notes.trim() || null,
      farmingLocationIds:
        clearsLocations || draft.farmingLocationIds.length === 0
          ? null
          : draft.farmingLocationIds,
      farmingStrategy: draft.farmingStrategy,
      acquisitionSources: draft.acquisitionSources ?? undefined,
    }
  }
  if (changes.projects) request.projectIds = draft.projectIds
  if (changes.priority && draft.priorityPosition !== null) {
    request.priority = {
      position: draft.priorityPosition,
      expectedOrderRevision: orderRevision,
    }
  }
  return request
}

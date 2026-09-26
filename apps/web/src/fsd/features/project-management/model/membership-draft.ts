/** A reviewed, unsaved membership edit: goals to add to the project and members to take out of it. The
 * baseline (the membership the user reviewed) is kept apart from the draft so filtering, grouping and
 * scrolling can never change what gets saved. */
export type MembershipDraft = { adds: string[]; removes: string[] }

export const EMPTY_MEMBERSHIP_DRAFT: MembershipDraft = {
  adds: [],
  removes: [],
}

export const hasPendingChanges = (draft: MembershipDraft) =>
  draft.adds.length > 0 || draft.removes.length > 0

/** Flips a goal's pending state: a member toggles "remove", a non-member toggles "add". */
export function toggleGoal(
  draft: MembershipDraft,
  goalId: string,
  isMember: boolean
): MembershipDraft {
  const key = isMember ? "removes" : "adds"
  const list = draft[key]
  return {
    ...draft,
    [key]: list.includes(goalId)
      ? list.filter((id) => id !== goalId)
      : [...list, goalId],
  }
}

/** Whether the goal belongs to the project once the draft is saved. */
export const isInDesiredSet = (
  baseline: ReadonlySet<string>,
  draft: MembershipDraft,
  goalId: string
) =>
  baseline.has(goalId)
    ? !draft.removes.includes(goalId)
    : draft.adds.includes(goalId)

/** The complete membership to save: the baseline minus pending removals, plus pending additions. */
export const desiredGoalIds = (
  baseline: readonly string[],
  draft: MembershipDraft
) => [
  ...baseline.filter((id) => !draft.removes.includes(id)),
  ...draft.adds.filter((id) => !baseline.includes(id)),
]

/** Drops draft entries a changed baseline has made meaningless: an addition that is already a member, a
 * removal of a goal that is no longer one. Everything else is kept as the user's intent. */
export function reconcileDraft(
  draft: MembershipDraft,
  baseline: readonly string[]
): MembershipDraft {
  const members = new Set(baseline)
  return {
    adds: draft.adds.filter((id) => !members.has(id)),
    removes: draft.removes.filter((id) => members.has(id)),
  }
}

/** What changed in the project between the reviewed baseline and its current membership. */
export function membershipDifference(
  reviewed: readonly string[],
  current: readonly string[]
) {
  const reviewedSet = new Set(reviewed)
  const currentSet = new Set(current)
  return {
    addedElsewhere: current.filter((id) => !reviewedSet.has(id)),
    removedElsewhere: reviewed.filter((id) => !currentSet.has(id)),
  }
}

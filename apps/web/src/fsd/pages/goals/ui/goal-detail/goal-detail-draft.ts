import type { GoalDetail } from "@/entities/goal"
import type { GoalDetailDraft } from "./goal-detail-edit-form"

export function hasSelectionChanged(
  current: string[],
  next: string[]
): boolean {
  return (
    current.length !== next.length || next.some((id) => !current.includes(id))
  )
}

export function hasGoalDetailDraftChanged(
  detail: GoalDetail,
  draft: GoalDetailDraft
): boolean {
  return (
    draft.notes.trim() !== (detail.notes ?? "") ||
    draft.farmingStrategy !== detail.config.farmingStrategy ||
    hasSelectionChanged(detail.projectIds, draft.selectedProjectIds) ||
    hasSelectionChanged(
      detail.config.farmingLocationIds ?? [],
      draft.selectedLocations
    )
  )
}

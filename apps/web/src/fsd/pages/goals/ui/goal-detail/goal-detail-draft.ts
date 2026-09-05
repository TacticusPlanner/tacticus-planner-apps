import type { AcquisitionSource, GoalDetail } from "@/entities/goal"
import type { GoalDetailDraft } from "./goal-detail-edit-form"

/** Order-independent comparison key for an acquisition-source set — a saved goal's entry order
 *  and a freshly-rebuilt `acquisitionSourcesFromPlan(...)`'s order aren't guaranteed to match even
 *  when the actual selection is identical, so `hasAcquisitionSourcesChanged` compares this instead
 *  of the raw arrays. */
export function normalizeAcquisitionSources(
  sources: readonly AcquisitionSource[]
): string {
  return JSON.stringify(
    [...sources]
      .map((source) => ({ kind: source.kind, ids: [...source.ids].sort() }))
      .sort((a, b) => a.kind.localeCompare(b.kind))
  )
}

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

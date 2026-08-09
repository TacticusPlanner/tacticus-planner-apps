import type { ProjectMembership } from "@/entities/goal"
import type { ProjectSummary } from "@/entities/project"

import { buildCombinedGoalSpecs } from "../estimate/goal-spec-builder"
import { buildPreviewGoalDetails } from "../estimate/per-project-estimate"
import { usePerProjectEstimates } from "../estimate/use-per-project-estimates"

type SpecParams = Parameters<typeof buildCombinedGoalSpecs>[0]

/**
 * "What will be created" project memberships and per-project duration preview — split out
 * of use-create-goal-form.ts purely for that file's own max-lines budget. `specParams` is the exact
 * same object `useGoalSubmit` builds `CombinedGoalSpec[]` from at submit time (owned by the caller,
 * not this hook, since `useGoalSubmit` needs it too) — the preview here mirrors that build with
 * `buildPreviewGoalDetails` rather than actually creating anything.
 */
export function useGoalCreationReview(params: {
  entityId: string | undefined
  entityType: "Character" | "Mow"
  canSubmit: boolean
  selectedProjectIds: string[]
  projects: ProjectSummary[]
  dailyEnergy: number
  inventoryUpgrades:
    readonly { upgradeId: string; amount: number }[] | undefined
  open: boolean
  specParams: SpecParams
}) {
  const selectedProjects: ProjectMembership[] = params.selectedProjectIds.map(
    (projectId) => ({ projectId })
  )

  // Placeholder GoalDetails for the per-project duration preview — never sent to the server (see
  // buildPreviewGoalDetails), built from the exact same spec list handleSubmit would send if the
  // user hit Create right now.
  const previewGoalDetails =
    params.entityId && params.canSubmit
      ? buildPreviewGoalDetails(
          params.entityType,
          params.entityId,
          buildCombinedGoalSpecs(params.specParams)
        )
      : []

  // No project checked means the goal will land in the caller's default project (goal.api.ts omits
  // `projects` in that case, same as `selectedProjects` above) — the duration preview should still
  // show something useful rather than going blank, so it falls back to that same default project
  // purely for this estimate.
  const defaultProjectId = params.projects.find(
    (project) => project.isDefault
  )?.projectId
  const estimatedProjectIds =
    params.selectedProjectIds.length > 0
      ? params.selectedProjectIds
      : defaultProjectId
        ? [defaultProjectId]
        : []

  const perProjectEstimates = usePerProjectEstimates({
    selectedProjectIds: estimatedProjectIds,
    projectPriorities: {},
    newDetails: previewGoalDetails,
    dailyEnergy: params.dailyEnergy,
    inventoryUpgrades: params.inventoryUpgrades ?? [],
    enabled:
      params.open &&
      estimatedProjectIds.length > 0 &&
      previewGoalDetails.length > 0,
  })

  return { selectedProjects, perProjectEstimates, estimatedProjectIds }
}

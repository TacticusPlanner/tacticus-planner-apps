import type { UnitId } from "@workspace/game-domain"
import { goalTargetKeyOf, type ProjectMembership } from "@/entities/goal"
import type { ProjectSummary } from "@/entities/project"
import { useTranslation } from "react-i18next"
import { useUnitName } from "@/shared/unit-name"
import {
  projectConflictText,
  useGoalSlotConflict,
  buildPreviewGoalDetails,
  usePerProjectEstimates,
} from "@/features/goal-planning/@x/goal-create"
import { buildCombinedGoalSpecs } from "./goal-spec-builder"
import { useGoalSubmit } from "./use-goal-submit"
import type { EntityType } from "./use-create-goal-form"

type SpecParams = Parameters<typeof buildCombinedGoalSpecs>[0]
type SnapshotContext = Parameters<typeof useGoalSubmit>[0]["snapshotContext"]

/**
 * Project-conflict gating, the "what will be created" review preview, and the submit handler
 * itself, kept as its own hook so `use-create-goal-form.ts` stays under the 800-line ceiling.
 * `specParams` is built by the caller (it also feeds the combined-spec builder directly, so owning
 * it here would just move the same spread expression without shrinking anything).
 */
export function useGoalSubmission({
  entityId,
  entityType,
  canSubmit,
  projects,
  selectedProjectIds,
  dailyEnergy,
  inventoryUpgrades,
  open,
  specParams,
  startPaused,
  notes,
  position,
  snapshotContext,
  onOpenChange,
  resetForm,
}: {
  entityId: UnitId | undefined
  entityType: EntityType
  canSubmit: boolean
  projects: ProjectSummary[]
  selectedProjectIds: string[]
  dailyEnergy: number
  inventoryUpgrades:
    readonly { upgradeId: string; amount: number }[] | undefined
  open: boolean
  specParams: SpecParams
  startPaused: boolean
  notes?: Parameters<typeof useGoalSubmit>[0]["notes"]
  position?: number | null
  snapshotContext: SnapshotContext
  onOpenChange: (open: boolean) => void
  resetForm: () => void
}) {
  const { t } = useTranslation()
  const getUnitName = useUnitName()
  // The in-flight slot is per account, whatever projects the goal joins. Each goal about to be created
  // conflicts only with an in-flight goal of the same unit and type at the same normalized end target —
  // distinct targets coexist (goal-target-milestones), so every spec of the request is checked.
  const slotConflict = useGoalSlotConflict({
    entityType,
    entityId,
    candidates: buildCombinedGoalSpecs(specParams).map((spec) => ({
      goalType: spec.goalType,
      targetKey: goalTargetKeyOf(spec),
    })),
  })
  const submissionAllowed =
    canSubmit && !slotConflict.loading && !slotConflict.conflict

  const { selectedProjects, perProjectEstimates, estimatedProjectIds } =
    useGoalCreationReview({
      entityId,
      entityType,
      canSubmit,
      selectedProjectIds,
      projects,
      dailyEnergy,
      inventoryUpgrades,
      open,
      specParams,
    })

  const submission = useGoalSubmit({
    entityId,
    entityType,
    canSubmit: submissionAllowed,
    selectedProjects,
    specParams,
    startPaused,
    notes,
    position,
    snapshotContext,
    onOpenChange,
    resetForm,
  })

  return {
    ...submission,
    canSubmit: submissionAllowed,
    // Shown in the conflicting goal type's card, under its target.
    slotConflictIssue: slotConflict.conflict
      ? {
          kind: slotConflict.conflict.goalType,
          field: "target",
          code: "slotConflict",
          message: projectConflictText(
            t,
            slotConflict.conflict,
            getUnitName(
              slotConflict.conflict.entityType,
              slotConflict.conflict.entityId
            )
          ),
        }
      : null,
    perProjectEstimates,
    estimatedProjectIds,
  }
}

/**
 * "What will be created" project memberships and per-project duration preview. `specParams` is the exact
 * same object `useGoalSubmit` builds `CombinedGoalSpec[]` from at submit time (owned by the caller,
 * not this hook, since `useGoalSubmit` needs it too) — the preview here mirrors that build with
 * `buildPreviewGoalDetails` rather than actually creating anything.
 */
function useGoalCreationReview(params: {
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

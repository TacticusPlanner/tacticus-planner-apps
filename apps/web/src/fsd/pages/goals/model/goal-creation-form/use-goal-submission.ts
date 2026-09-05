import type { UnitId } from "@workspace/game-domain"

import type { GoalKind } from "@/entities/goal"
import type { ProjectSummary } from "@/entities/project"

import { useProjectGoalConflicts } from "../projects/use-project-goal-conflicts"
import { buildCombinedGoalSpecs } from "../estimate/goal-spec-builder"
import { useGoalCreationReview } from ".//use-goal-creation-review"
import { useGoalSubmit } from ".//use-goal-submit"
import type { EntityType } from ".//use-create-goal-form"

type SpecParams = Parameters<typeof buildCombinedGoalSpecs>[0]
type SnapshotContext = Parameters<typeof useGoalSubmit>[0]["snapshotContext"]

/**
 * Project-conflict gating, the "what will be created" review preview, and the submit handler
 * itself — split out of `use-create-goal-form.ts` purely for that file's own max-lines budget.
 * `specParams` is built by the caller (it also feeds the combined-spec builder directly, so owning
 * it here would just move the same spread expression without shrinking anything).
 */
export function useGoalSubmission({
  entityId,
  entityType,
  canSubmit,
  projects,
  selectedProjectIds,
  goalTypes,
  dailyEnergy,
  inventoryUpgrades,
  open,
  specParams,
  snapshotContext,
  onOpenChange,
  onCreated,
  resetForm,
}: {
  entityId: UnitId | undefined
  entityType: EntityType
  canSubmit: boolean
  projects: ProjectSummary[]
  selectedProjectIds: string[]
  goalTypes: GoalKind[]
  dailyEnergy: number
  inventoryUpgrades:
    readonly { upgradeId: string; amount: number }[] | undefined
  open: boolean
  specParams: SpecParams
  snapshotContext: SnapshotContext
  onOpenChange: (open: boolean) => void
  onCreated: () => void
  resetForm: () => void
}) {
  const projectConflictState = useProjectGoalConflicts({
    projects,
    selectedProjectIds,
    entityType,
    entityId,
    goalTypes,
  })
  const submissionAllowed =
    canSubmit &&
    !projectConflictState.loading &&
    projectConflictState.conflicts.length === 0

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
    snapshotContext,
    onOpenChange,
    onCreated,
    resetForm,
  })

  return {
    ...submission,
    canSubmit: submissionAllowed,
    projectConflicts: projectConflictState.conflicts,
    perProjectEstimates,
    estimatedProjectIds,
  }
}

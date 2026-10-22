import { useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { UnitId } from "@workspace/game-domain"

import {
  buildCreateGoalSnapshot,
  createCombinedGoals,
  goalQueries,
  type GoalKind,
  type ProjectMembership,
} from "@/entities/goal"
import { projectQueries } from "@/entities/project"
import { ApiError } from "@/shared/api"

import { buildCombinedGoalSpecs } from "../estimate/goal-spec-builder"
import { projectConflictText } from "../projects/project-conflict-copy"
import { projectGoalSlotConflictDetails } from "../projects/project-membership"
import type { EntityType } from ".//use-create-goal-form"

type SpecParams = Parameters<typeof buildCombinedGoalSpecs>[0]
type SnapshotContext = Omit<
  Parameters<typeof buildCreateGoalSnapshot>[0],
  "spec"
>

/**
 * Submission state (status/error/"create another") and the submit handler itself — assembles the
 * combined-goal specs (pure builder in `goal-spec-builder.ts`) and their snapshots (pure builder
 * in `goal-snapshot-builder.ts`), fires the mutation, and resets or closes the sheet on success.
 * The created goals are written into their cached details; the goal lists and the member lists of
 * the projects they joined are refetched, since a new goal changes both (spec: client-data-freshness).
 * Split out of `use-create-goal-form.ts` purely for that file's own max-lines budget; takes the
 * rest of that hook's assembled state as plain params rather than owning any of it itself.
 */
export function useGoalSubmit({
  entityId,
  entityType,
  canSubmit,
  selectedProjects,
  specParams,
  startPaused,
  snapshotContext,
  onOpenChange,
  resetForm,
}: {
  entityId: UnitId | undefined
  entityType: EntityType
  canSubmit: boolean
  selectedProjects: ProjectMembership[]
  specParams: SpecParams
  startPaused: boolean
  snapshotContext: SnapshotContext
  onOpenChange: (open: boolean) => void
  resetForm: () => void
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [createAnother, setCreateAnother] = useState(false)
  const createGoals = useMutation({
    // Builds the request inside the mutation so a builder failure reports like a rejected request.
    mutationFn: (unitId: UnitId) => {
      const specs = buildCombinedGoalSpecs(specParams)
      return createCombinedGoals({
        entityType,
        entityId: unitId,
        projects: selectedProjects.length > 0 ? selectedProjects : undefined,
        goals: specs.map((spec) => ({
          ...spec,
          snapshot: buildCreateGoalSnapshot({ ...snapshotContext, spec }),
        })),
        // Omitted rather than sent as false when off, so the default path's body stays byte-identical
        // to today's — the API's own default is what produces the Active goal.
        ...(startPaused ? { startPaused: true } : {}),
      })
    },
    onSuccess: ({ goals }) => {
      for (const goal of goals) {
        queryClient.setQueryData(goalQueries.detail(goal.goalId).queryKey, goal)
      }
      void queryClient.invalidateQueries({ queryKey: goalQueries.lists() })
      for (const projectId of new Set(
        goals.flatMap((goal) => goal.projectIds)
      )) {
        void queryClient.invalidateQueries({
          queryKey: projectQueries.goals(projectId).queryKey,
        })
      }

      // Success clears the form either way (remembering the project/type choice for the next one), so
      // a reopened sheet never shows the finished goal's unit-specific targets.
      resetForm()
      if (!createAnother) {
        onOpenChange(false)
      }
    },
  })
  const status = createGoals.isPending
    ? "submitting"
    : createGoals.isError
      ? "error"
      : "idle"
  // The form stays open with its draft intact on an error (only the message shown changes). A slot
  // conflict raised after the pre-check (another session took the same Rank target first) names the
  // occupied target and project rather than the server's generic sentence.
  const error = createGoals.error
  const conflict =
    error instanceof ApiError
      ? projectGoalSlotConflictDetails(error.details)
      : null
  const errorMessage = !error
    ? null
    : conflict
      ? projectConflictText(
          t,
          conflict.projectName,
          [conflict.goalType as GoalKind],
          conflict.normalizedTarget
        )
      : error instanceof ApiError
        ? error.message
        : t("goals.create.genericError")

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!entityId || !canSubmit) {
      return
    }
    // Rejections are read back from the mutation (`status`/`errorMessage`), not rethrown.
    await createGoals.mutateAsync(entityId).catch(() => undefined)
  }

  return { createAnother, setCreateAnother, status, errorMessage, handleSubmit }
}

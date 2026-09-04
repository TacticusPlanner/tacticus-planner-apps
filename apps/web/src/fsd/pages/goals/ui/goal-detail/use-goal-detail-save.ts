import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import {
  goalQueries,
  updateGoal,
  updateGoalProjects,
  type AcquisitionSource,
  type GoalDetail,
} from "@/entities/goal"
import { projectQueries } from "@/entities/project"
import { ApiError } from "@/shared/api"

import { acquisitionSourcesFromPlan } from "../../model/goal-creation-form/acquisition-plan"
import { projectGoalSlotConflictDetails } from "../../model/projects/project-membership"
import type { GoalDetailDraft } from "./goal-detail-edit-form"
import type { GoalDetailSaveError } from "./goal-detail-error"

/**
 * The edit sheet's save mutations (goal fields + project membership) and the `save` handler that
 * sequences them — split out of `goal-detail-sheet.tsx` purely for that file's own max-lines
 * budget. Mode/draft state stays owned by the caller since it's read from JSX in many places;
 * `resetDraft`/`setMode` are invoked here only on a successful save.
 */
export function useGoalDetailSave({
  detail,
  draft,
  isRank,
  isLevel,
  usesAcquisitionSources,
  isUnlock,
  overrideValid,
  projectsValid,
  projectsChanged,
  acquisitionPlan,
  isAuthenticated,
  onUpdated,
  resetDraft,
  setMode,
}: {
  detail: GoalDetail | null
  draft: Pick<
    GoalDetailDraft,
    "notes" | "selectedLocations" | "farmingStrategy" | "selectedProjectIds"
  >
  isRank: boolean
  isLevel: boolean
  usesAcquisitionSources: boolean
  isUnlock: boolean
  overrideValid: boolean
  projectsValid: boolean
  projectsChanged: boolean
  acquisitionPlan: Parameters<typeof acquisitionSourcesFromPlan>[0]
  isAuthenticated: boolean
  onUpdated: () => void
  resetDraft: () => void
  setMode: (mode: "view" | "edit") => void
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [saveError, setSaveError] = useState<GoalDetailSaveError | null>(null)

  const updateMutation = useMutation({
    mutationFn: (request: {
      goalId: string
      notes: string | null
      farmingLocationIds: string[] | null
      farmingStrategy: GoalDetailDraft["farmingStrategy"]
      acquisitionSources?: AcquisitionSource[]
    }) =>
      updateGoal(request.goalId, {
        notes: request.notes,
        farmingLocationIds: request.farmingLocationIds,
        farmingStrategy: request.farmingStrategy,
        acquisitionSources: request.acquisitionSources,
      }),
    onSuccess: async (updated) => {
      queryClient.setQueryData(
        goalQueries.detail(updated.goalId).queryKey,
        updated
      )
      await queryClient.invalidateQueries({ queryKey: goalQueries.lists() })
    },
  })

  const updateProjectsMutation = useMutation({
    mutationFn: (request: { goalId: string; projectIds: string[] }) =>
      updateGoalProjects(request.goalId, request.projectIds),
    onSuccess: async (updated) => {
      queryClient.setQueryData(
        goalQueries.detail(updated.goalId).queryKey,
        updated
      )
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: goalQueries.lists() }),
        queryClient.invalidateQueries({ queryKey: projectQueries.all() }),
      ])
    },
  })

  const save = async () => {
    if (!detail || !isAuthenticated || !overrideValid || !projectsValid) return
    setSaveError(null)
    try {
      await updateMutation.mutateAsync({
        goalId: detail.goalId,
        notes: draft.notes.trim() || null,
        farmingLocationIds:
          isRank || isLevel || usesAcquisitionSources
            ? null
            : draft.selectedLocations.length > 0
              ? draft.selectedLocations
              : null,
        farmingStrategy: draft.farmingStrategy,
        acquisitionSources: usesAcquisitionSources
          ? acquisitionSourcesFromPlan(acquisitionPlan, { isUnlock })
          : undefined,
      })
      if (projectsChanged) {
        await updateProjectsMutation.mutateAsync({
          goalId: detail.goalId,
          projectIds: draft.selectedProjectIds,
        })
      }
      resetDraft()
      setMode("view")
      onUpdated()
    } catch (reason) {
      const conflict =
        reason instanceof ApiError
          ? projectGoalSlotConflictDetails(reason.details)
          : null
      setSaveError({
        goalId: detail.goalId,
        message:
          reason instanceof ApiError
            ? reason.message
            : t("goals.detail.saveError"),
        existingGoalId: conflict?.existingGoalId,
      })
    }
  }

  return {
    saveError,
    setSaveError,
    updateMutation,
    updateProjectsMutation,
    save,
  }
}

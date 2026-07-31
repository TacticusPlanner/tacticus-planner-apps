import { useState } from "react"
import { useTranslation } from "react-i18next"
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { useIsAuthenticated } from "@azure/msal-react"
import { Button } from "@workspace/ui/components/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet"
import { Skeleton } from "@workspace/ui/components/skeleton"

import { goalQueries, updateGoal, updateGoalProjects } from "@/entities/goal"
import { projectQueries } from "@/entities/project"
import { ApiError } from "@/shared/api"
import {
  NO_BLOCKERS,
  UNKNOWN_PROGRESS,
} from "../../model/attainment/goal-overview-metrics-defaults"
import { useGoalsOverviewMetrics } from "../../model/attainment/use-goals-overview-metrics"
import type { EstimateOutcome } from "../../model/estimate/estimate.domain"
import { useGoalCatalog } from "../../model/shared/use-goal-catalog"
import { useGoalLocationGroups } from "../../model/farming/use-goal-location-groups"
import { GoalProgressDisplay, GoalProjectBadges } from "../shared/goal-visuals"
import { BlockedIndicator, StatusBadge } from "../shared/status-badge"
import { DiscardChangesDialog } from ".//discard-changes-dialog"
import {
  GoalDetailEditForm,
  type GoalDetailDraft,
} from ".//goal-detail-edit-form"
import { GoalDetailView } from ".//goal-detail-view"

type Mode = "view" | "edit"

export function GoalDetailSheet({
  goalId,
  estimate,
  isolated,
  onOpenChange,
  onUpdated,
}: {
  goalId: string | null
  estimate: EstimateOutcome | undefined
  isolated: boolean
  onOpenChange: (open: boolean) => void
  onUpdated: () => void
}) {
  const { t } = useTranslation()
  const isAuthenticated = useIsAuthenticated()
  const queryClient = useQueryClient()
  const { getEntityName, upgradesById, charactersById } = useGoalCatalog()
  const [mode, setMode] = useState<Mode>("view")
  const [confirmAction, setConfirmAction] = useState<"cancel" | "close" | null>(
    null
  )
  const [draftState, setDraftState] = useState<
    (GoalDetailDraft & { key: string }) | null
  >(null)
  const [saveError, setSaveError] = useState<{
    goalId: string
    message: string
  } | null>(null)
  const detailQuery = useQuery({
    ...goalQueries.detail(goalId ?? "unselected"),
    enabled: Boolean(isAuthenticated && goalId),
  })
  const detail = detailQuery.data ?? null
  const dependencyQueries = useQueries({
    queries: (detail?.dependsOn ?? []).map((id) => ({
      ...goalQueries.detail(id),
      enabled: isAuthenticated,
    })),
  })
  const dependencies = dependencyQueries.flatMap((query) =>
    query.data ? [query.data] : []
  )
  const draftKey = detail ? `${detail.goalId}:${detail.updatedAt}` : ""
  const draft =
    draftState?.key === draftKey
      ? draftState
      : {
          key: draftKey,
          notes: detail?.notes ?? "",
          selectedLocations: detail?.config.farmingLocationIds ?? [],
          selectedProjectIds: detail?.projectIds ?? [],
          farmingStrategy: detail?.config.farmingStrategy ?? "TotalUpgrades",
        }

  const projectsQuery = useQuery({
    ...projectQueries.list(),
    enabled: isAuthenticated,
  })
  const projects = projectsQuery.data?.projects ?? []

  const overviewMetrics = useGoalsOverviewMetrics(
    goalId ? [goalId] : [],
    goalId && estimate ? new Map([[goalId, estimate]]) : undefined
  )
  const metrics = goalId ? overviewMetrics.get(goalId) : undefined

  const updateMutation = useMutation({
    mutationFn: (request: {
      goalId: string
      notes: string | null
      farmingLocationIds: string[] | null
      farmingStrategy: GoalDetailDraft["farmingStrategy"]
    }) =>
      updateGoal(request.goalId, {
        notes: request.notes,
        farmingLocationIds: request.farmingLocationIds,
        farmingStrategy: request.farmingStrategy,
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

  const { isRank, isUnlock, isLevel, allLocations, overrideValid } =
    useGoalLocationGroups(
      detail,
      upgradesById,
      charactersById,
      draft.selectedLocations
    )

  const projectsValid = draft.selectedProjectIds.length > 0
  const projectsChanged =
    draft.selectedProjectIds.length !== (detail?.projectIds.length ?? 0) ||
    draft.selectedProjectIds.some((id) => !detail?.projectIds.includes(id))
  // Set comparison, not array equality — toggling a checkbox off and back on reorders
  // `selectedLocations` (see `GoalLocationsField`'s onToggle) without changing the actual selection.
  const locationsChanged =
    draft.selectedLocations.length !==
      (detail?.config.farmingLocationIds?.length ?? 0) ||
    draft.selectedLocations.some(
      (id) => !(detail?.config.farmingLocationIds ?? []).includes(id)
    )
  const hasUnsavedChanges =
    mode === "edit" &&
    !!detail &&
    (draft.notes.trim() !== (detail.notes ?? "") ||
      draft.farmingStrategy !== detail.config.farmingStrategy ||
      projectsChanged ||
      locationsChanged)

  const resetDraft = () => setDraftState(null)

  const enterEdit = () => setMode("edit")
  const requestLeaveEdit = () => {
    if (hasUnsavedChanges) {
      setConfirmAction("cancel")
      return
    }
    resetDraft()
    setMode("view")
  }
  const confirmDiscard = () => {
    resetDraft()
    setMode("view")
    if (confirmAction === "close") onOpenChange(false)
    setConfirmAction(null)
  }

  const save = async () => {
    if (!detail || !isAuthenticated || !overrideValid || !projectsValid) return
    setSaveError(null)
    try {
      await updateMutation.mutateAsync({
        goalId: detail.goalId,
        notes: draft.notes.trim() || null,
        farmingLocationIds:
          isRank || isLevel
            ? null
            : draft.selectedLocations.length > 0
              ? draft.selectedLocations
              : null,
        farmingStrategy: draft.farmingStrategy,
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
      setSaveError({
        goalId: detail.goalId,
        message:
          reason instanceof ApiError
            ? reason.message
            : t("goals.detail.saveError"),
      })
    }
  }

  const error = detailQuery.isError
    ? detailQuery.error instanceof ApiError
      ? detailQuery.error.message
      : t("goals.detail.loadError")
    : saveError?.goalId === goalId
      ? saveError.message
      : null

  const requestClose = (open: boolean) => {
    if (open) return
    if (hasUnsavedChanges) {
      setConfirmAction("close")
      return
    }
    resetDraft()
    setMode("view")
    onOpenChange(false)
  }

  const assignedProjects = detail
    ? detail.projectIds
        .map((projectId) => projects.find((p) => p.projectId === projectId))
        .filter((project): project is (typeof projects)[number] => !!project)
        .map((project) => ({
          projectId: project.projectId,
          name: project.name,
          color: project.color,
          isActivePlan: project.isActivePlan,
        }))
    : []

  const farmingSummary = !detail
    ? null
    : isLevel
      ? null
      : isRank
        ? t(`goals.create.farmingStrategy.${detail.config.farmingStrategy}`)
        : (detail.config.farmingLocationIds?.length ?? 0) > 0
          ? t("goals.detail.farmingSelected", {
              count: detail.config.farmingLocationIds!.length,
            })
          : t("goals.detail.farmingAuto")

  return (
    <Sheet open={!!goalId} onOpenChange={requestClose}>
      <SheetContent
        className="overflow-y-auto"
        data-testid="goal-detail-sheet"
        onPointerDownOutside={(event) => event.preventDefault()}
      >
        <SheetHeader>
          <SheetTitle>
            {detail
              ? getEntityName(detail.entityType, detail.entityId)
              : t("goals.detail.title")}
          </SheetTitle>
          <SheetDescription>
            {detail ? t(`goals.create.goalTypes.${detail.goalType}`) : ""}
          </SheetDescription>
        </SheetHeader>
        {!detail && !error ? <Skeleton className="mx-4 h-48" /> : null}
        {error ? (
          <p className="px-4 text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        {detail ? (
          <>
            <div className="grid gap-2 px-4 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={detail.status} />
                <BlockedIndicator blockers={metrics?.blockers ?? NO_BLOCKERS} />
              </div>
              {/* View mode shows progress/projects itself (see `GoalDetailView`'s own sections) —
                  only edit mode needs this read-only context surfaced up here, since its form has no
                  progress/projects display of its own. */}
              {mode === "edit" ? (
                <>
                  <GoalProgressDisplay
                    progress={metrics?.progress ?? UNKNOWN_PROGRESS}
                  />
                  {assignedProjects.length > 0 ? (
                    <GoalProjectBadges projects={assignedProjects} />
                  ) : null}
                </>
              ) : null}
            </div>

            {mode === "view" ? (
              <GoalDetailView
                assignedProjects={assignedProjects}
                blockers={metrics?.blockers ?? NO_BLOCKERS}
                dependencies={dependencies}
                detail={detail}
                estimate={estimate}
                farmingSummary={farmingSummary}
                getEntityName={getEntityName}
                isolated={isolated}
                progress={metrics?.progress ?? UNKNOWN_PROGRESS}
                remaining={metrics?.remaining ?? null}
              />
            ) : (
              <GoalDetailEditForm
                allLocations={allLocations}
                detail={detail}
                draft={draft}
                isLevel={isLevel}
                isRank={isRank}
                isUnlock={isUnlock}
                onDraftChange={(next) =>
                  setDraftState({ ...next, key: draftKey })
                }
                overrideValid={overrideValid}
                projects={projects}
                projectsValid={projectsValid}
              />
            )}
          </>
        ) : null}
        {detail ? (
          <SheetFooter>
            {mode === "view" ? (
              <Button data-testid="goal-detail-edit" onClick={enterEdit}>
                {t("goals.detail.edit")}
              </Button>
            ) : (
              <>
                <Button
                  data-testid="goal-detail-cancel"
                  onClick={requestLeaveEdit}
                  variant="outline"
                >
                  {t("goals.detail.cancel")}
                </Button>
                <Button
                  data-testid="goal-detail-save"
                  disabled={
                    updateMutation.isPending ||
                    updateProjectsMutation.isPending ||
                    !overrideValid ||
                    !projectsValid
                  }
                  onClick={() => void save()}
                >
                  {t("goals.detail.save")}
                </Button>
              </>
            )}
          </SheetFooter>
        ) : null}
      </SheetContent>

      <DiscardChangesDialog
        onDiscard={confirmDiscard}
        onKeepEditing={() => setConfirmAction(null)}
        open={confirmAction !== null}
      />
    </Sheet>
  )
}

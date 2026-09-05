import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useQueries, useQuery } from "@tanstack/react-query"
import { useIsAuthenticated } from "@azure/msal-react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet"
import { Skeleton } from "@workspace/ui/components/skeleton"

import { goalQueries } from "@/entities/goal"
import { projectQueries } from "@/entities/project"
import { usePlanningSettings } from "@/entities/planning-setting"
import { ApiError } from "@/shared/api"
import {
  NO_BLOCKERS,
  UNKNOWN_PROGRESS,
} from "../../model/attainment/goal-overview-metrics-defaults"
import { useGoalsOverviewMetrics } from "../../model/attainment/use-goals-overview-metrics"
import type { EstimateOutcome } from "@/features/goal-farming"
import { useGoalCatalog } from "../../model/shared/use-goal-catalog"
import { useGoalLocationGroups } from "../../model/farming/use-goal-location-groups"
import { useCreateGoalLauncher } from "../../model/goal-creation-form/create-goal-launcher-context"
import type { BlockerReason } from "../../model/blockers/goal-blockers"
import { prerequisitePrefill } from "../../model/blockers/prerequisite-prefill"
import { useProjectGoalConflicts } from "../../model/projects/use-project-goal-conflicts"
import { GoalProgressDisplay, GoalProjectBadges } from "../shared/goal-visuals"
import { BlockedIndicator, StatusBadge } from "../shared/status-badge"
import {
  GoalDetailEditForm,
  type GoalDetailDraft,
} from "./goal-detail-edit-form"
import { GoalDetailView } from "./goal-detail-view"
import { GoalDetailFooter } from "./goal-detail-footer"
import { GoalDetailError } from "./goal-detail-error"
import { goalDetailProjects } from "./goal-detail-projects"
import { GoalDetailUnsavedDialog } from "./goal-detail-unsaved-dialog"
import {
  hasGoalDetailDraftChanged,
  hasSelectionChanged,
} from "./goal-detail-draft"
import { useGoalDetailAcquisition } from "./use-goal-detail-acquisition"
import { useGoalDetailSave } from "./use-goal-detail-save"

type ConfirmAction = "cancel" | "close" | null
type KeyedGoalDetailDraft = GoalDetailDraft & { key: string }

export function GoalDetailSheet({
  goalId,
  estimate,
  isolated,
  onOpenChange,
  onUpdated,
  potentialRatio,
  onGoalChange,
}: {
  goalId: string | null
  estimate: EstimateOutcome | undefined
  isolated: boolean
  onOpenChange: (open: boolean) => void
  onUpdated: () => void
  potentialRatio?: number
  onGoalChange?: (goalId: string) => void
}) {
  const { t } = useTranslation()
  const isAuthenticated = useIsAuthenticated()
  const launchCreateGoal = useCreateGoalLauncher()
  const {
    getEntityName,
    upgradesById,
    charactersById,
    battlesById,
    unlockShardCostsById,
  } = useGoalCatalog()
  const { settings: planningSettings } = usePlanningSettings()
  const [mode, setMode] = useState<"view" | "edit">("view")
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null)
  const [draftState, setDraftState] = useState<KeyedGoalDetailDraft | null>(
    null
  )
  const [sheetNode, setSheetNode] = useState<HTMLElement | null>(null)
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
  const draftKey = detail?.goalId ?? ""
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
  const membershipConflicts = useProjectGoalConflicts({
    projects,
    selectedProjectIds: draft.selectedProjectIds,
    entityType: detail?.entityType ?? "Character",
    entityId: detail?.entityId,
    goalTypes: detail ? [detail.goalType] : [],
    excludeGoalId: detail?.goalId,
    enabled: mode === "edit",
  })

  const overviewMetrics = useGoalsOverviewMetrics(
    goalId ? [goalId] : [],
    goalId && estimate ? new Map([[goalId, estimate]]) : undefined
  )
  const metrics = goalId ? overviewMetrics.get(goalId) : undefined

  const { isRank, isUnlock, isLevel, allLocations, overrideValid } =
    useGoalLocationGroups(
      detail,
      upgradesById,
      charactersById,
      draft.selectedLocations
    )

  const {
    isAscension,
    usesAcquisitionSources,
    acquisitionSeed,
    acquisitionSelection,
    hasAcquisitionSourcesChanged,
    shopOffers,
  } = useGoalDetailAcquisition({
    detail,
    mode,
    isUnlock,
    charactersById,
    unlockShardCostsById,
    battlesById,
    dailyEnergy: planningSettings.dailyEnergy,
  })

  const projectsValid =
    draft.selectedProjectIds.length > 0 &&
    !membershipConflicts.loading &&
    membershipConflicts.conflicts.length === 0
  const hasUnsavedChanges =
    mode === "edit" &&
    !!detail &&
    (hasGoalDetailDraftChanged(detail, draft) || hasAcquisitionSourcesChanged)
  const projectsChanged =
    !!detail && hasSelectionChanged(detail.projectIds, draft.selectedProjectIds)

  const resetDraft = () => setDraftState(null)

  const enterEdit = () => {
    if (!detail) return
    setDraftState({
      key: detail.goalId,
      notes: detail.notes ?? "",
      selectedLocations: detail.config.farmingLocationIds ?? [],
      selectedProjectIds: detail.projectIds,
      farmingStrategy: detail.config.farmingStrategy,
    })
    acquisitionSelection.reseed(acquisitionSeed)
    setMode("edit")
  }
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
    acquisitionSelection.reseed(acquisitionSeed)
    setMode("view")
    if (confirmAction === "close") onOpenChange(false)
    setConfirmAction(null)
  }

  const { saveError, updateMutation, updateProjectsMutation, save } =
    useGoalDetailSave({
      detail,
      draft,
      isRank,
      isLevel,
      usesAcquisitionSources,
      isUnlock,
      overrideValid,
      projectsValid,
      projectsChanged,
      acquisitionPlan: acquisitionSelection.plan,
      isAuthenticated,
      onUpdated,
      resetDraft,
      setMode,
    })

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

  const assignedProjects = goalDetailProjects(detail, projects)

  const createPrerequisite = (
    reason: Extract<
      BlockerReason,
      { kind: "MissingLevelPrerequisite" | "MissingAscensionPrerequisite" }
    >
  ) => {
    if (!detail) return
    const prefill = prerequisitePrefill(detail, reason)
    if (!prefill) return
    resetDraft()
    setMode("view")
    onOpenChange(false)
    launchCreateGoal(prefill)
  }

  const viewPrerequisiteGoal = (nextGoalId: string) => {
    resetDraft()
    setMode("view")
    onGoalChange?.(nextGoalId)
  }

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
        ref={setSheetNode}
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
          <GoalDetailError
            error={error}
            existingGoalId={
              saveError?.goalId === goalId
                ? saveError.existingGoalId
                : undefined
            }
            onGoalChange={onGoalChange}
          />
        ) : null}
        {detail ? (
          <>
            <div className="grid gap-2 px-4 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={detail.status} />
                <BlockedIndicator blockers={metrics?.blockers ?? NO_BLOCKERS} />
              </div>
              {mode === "edit" ? (
                <>
                  <GoalProgressDisplay
                    potentialRatio={potentialRatio}
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
                onCreatePrerequisite={createPrerequisite}
                onViewGoal={viewPrerequisiteGoal}
                progress={metrics?.progress ?? UNKNOWN_PROGRESS}
                potentialRatio={potentialRatio}
                remaining={metrics?.remaining ?? null}
              />
            ) : (
              <GoalDetailEditForm
                acquisitionSelection={acquisitionSelection}
                allLocations={allLocations}
                battlesById={battlesById}
                detail={detail}
                conflicts={membershipConflicts.conflicts}
                draft={draft}
                isAscension={isAscension}
                isLevel={isLevel}
                isRank={isRank}
                isUnlock={isUnlock}
                onDraftChange={(next) =>
                  setDraftState({ ...next, key: draftKey })
                }
                overrideValid={overrideValid}
                portalContainer={sheetNode}
                projects={projects}
                projectsValid={projectsValid}
                shopOffers={shopOffers}
              />
            )}
          </>
        ) : null}
        {detail ? (
          <GoalDetailFooter
            mode={mode}
            onCancel={requestLeaveEdit}
            onEdit={enterEdit}
            onSave={() => void save()}
            saveDisabled={
              updateMutation.isPending ||
              updateProjectsMutation.isPending ||
              !overrideValid ||
              !projectsValid
            }
          />
        ) : null}
      </SheetContent>

      <GoalDetailUnsavedDialog
        onCancel={() => setConfirmAction(null)}
        onConfirm={confirmDiscard}
        open={confirmAction !== null}
      />
    </Sheet>
  )
}

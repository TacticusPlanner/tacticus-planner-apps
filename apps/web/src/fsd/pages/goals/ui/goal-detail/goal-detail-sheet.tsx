import { useState } from "react"
import { useTranslation } from "react-i18next"
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { useIsAuthenticated } from "@azure/msal-react"
import { rankAt } from "@workspace/game-domain"
import { Button } from "@workspace/ui/components/button"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Textarea } from "@workspace/ui/components/textarea"

import {
  goalQueries,
  updateGoal,
  updateGoalProjects,
  type FarmingStrategy,
} from "@/entities/goal"
import { projectQueries } from "@/entities/project"
import { ApiError } from "@/shared/api"
import type { EstimateOutcome } from "../../model/estimate/estimate.domain"
import { additionalTargetFromWire } from "../../model/estimate/rank-additional-target"
import { useGoalCatalog } from "../../model/shared/use-goal-catalog"
import { useGoalLocationGroups } from "../../model/farming/use-goal-location-groups"
import { FarmingStrategyField } from "../create-goal/farming-strategy-field"
import { GoalEstimateSection } from ".//goal-estimate-section"
import { GoalLevelSummary } from "../create-goal/goal-level-summary"
import { GoalLocationsField } from "../create-goal/goal-locations-field"
import { GoalProjectsField } from "../projects/goal-projects-field"
import { StatusBadge } from "../shared/status-badge"

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
  const [draftState, setDraftState] = useState<{
    key: string
    notes: string
    selectedLocations: string[]
    selectedProjectIds: string[]
    farmingStrategy: FarmingStrategy
  } | null>(null)
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
  const notes = draft.notes
  const selectedLocations = draft.selectedLocations
  const selectedProjectIds = draft.selectedProjectIds
  const farmingStrategy = draft.farmingStrategy

  const projectsQuery = useQuery({
    ...projectQueries.list(),
    enabled: isAuthenticated,
  })
  const projects = projectsQuery.data?.projects ?? []

  const updateMutation = useMutation({
    mutationFn: (request: {
      goalId: string
      notes: string | null
      farmingLocationIds: string[] | null
      farmingStrategy: FarmingStrategy
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
      await queryClient.invalidateQueries({
        queryKey: goalQueries.lists(),
      })
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
      selectedLocations
    )

  const projectsValid = selectedProjectIds.length > 0
  const projectsChanged =
    selectedProjectIds.length !== (detail?.projectIds.length ?? 0) ||
    selectedProjectIds.some((id) => !detail?.projectIds.includes(id))

  const save = async () => {
    if (!detail || !isAuthenticated || !overrideValid || !projectsValid) return
    setSaveError(null)
    try {
      await updateMutation.mutateAsync({
        goalId: detail.goalId,
        notes: notes.trim() || null,
        farmingLocationIds:
          isRank || isLevel
            ? null
            : selectedLocations.length > 0
              ? selectedLocations
              : null,
        farmingStrategy,
      })
      if (projectsChanged) {
        await updateProjectsMutation.mutateAsync({
          goalId: detail.goalId,
          projectIds: selectedProjectIds,
        })
      }
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

  return (
    <Sheet open={!!goalId} onOpenChange={onOpenChange}>
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
          <div className="grid gap-6 px-4 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={detail.status} />
            </div>

            <GoalEstimateSection estimate={estimate} isolated={isolated} />

            <section className="grid gap-2">
              <h3 className="font-semibold">
                {t("goals.detail.dependenciesTitle")}
              </h3>
              {dependencies.length > 0 ? (
                dependencies.map((item) => (
                  <p key={item.goalId}>
                    {getEntityName(item.entityType, item.entityId)} ·{" "}
                    {t(`goals.create.goalTypes.${item.goalType}`)}
                  </p>
                ))
              ) : (
                <p className="text-muted-foreground">
                  {t("goals.detail.none")}
                </p>
              )}
            </section>

            <section className="grid gap-2">
              <h3 className="font-semibold">
                {t("goals.detail.historyTitle")}
              </h3>
              <ol className="grid gap-1">
                {detail.events.map((event, index) => (
                  <li key={`${event.at}-${index}`}>
                    {event.type} · {new Date(event.at).toLocaleString()}
                  </li>
                ))}
              </ol>
            </section>

            <Field>
              <FieldLabel htmlFor="goal-notes">
                {t("goals.detail.notes")}
              </FieldLabel>
              <Textarea
                id="goal-notes"
                maxLength={200}
                value={notes}
                onChange={(event) =>
                  setDraftState({ ...draft, notes: event.target.value })
                }
              />
              <span className="text-xs text-muted-foreground">
                {notes.length}/200
              </span>
            </Field>

            <GoalProjectsField
              projects={projects}
              selectedProjectIds={selectedProjectIds}
              projectsValid={projectsValid}
              onToggle={(projectId, checked) =>
                setDraftState({
                  ...draft,
                  selectedProjectIds: checked
                    ? [...selectedProjectIds, projectId]
                    : selectedProjectIds.filter((id) => id !== projectId),
                })
              }
            />

            {isRank && detail.config.rank ? (
              <FarmingStrategyField
                abilityActiveEnd={0}
                abilityActiveStart={0}
                abilityPassiveEnd={0}
                abilityPassiveStart={0}
                context="rank"
                farmingStrategy={farmingStrategy}
                onFarmingStrategyChange={(value) =>
                  setDraftState({ ...draft, farmingStrategy: value })
                }
                rankAdditionalTarget={additionalTargetFromWire(
                  rankAt(detail.config.rank.end),
                  detail.config.rank
                )}
                rankEnd={rankAt(detail.config.rank.end)}
                rankStart={rankAt(detail.config.rank.start)}
              />
            ) : null}

            {isLevel && detail.config.level ? (
              <GoalLevelSummary target={detail.config.level} />
            ) : null}

            {!isRank && !isLevel ? (
              <GoalLocationsField
                allLocations={allLocations}
                isUnlock={isUnlock}
                onToggle={(battleId, checked) =>
                  setDraftState({
                    ...draft,
                    selectedLocations: checked
                      ? [...selectedLocations, battleId]
                      : selectedLocations.filter((id) => id !== battleId),
                  })
                }
                overrideValid={overrideValid}
                selectedLocations={selectedLocations}
              />
            ) : null}
          </div>
        ) : null}
        <SheetFooter>
          <Button
            disabled={
              !detail ||
              updateMutation.isPending ||
              updateProjectsMutation.isPending ||
              !overrideValid ||
              !projectsValid
            }
            onClick={() => void save()}
          >
            {t("goals.detail.save")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

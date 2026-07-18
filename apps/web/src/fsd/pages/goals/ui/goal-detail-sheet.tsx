import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { useIsAuthenticated } from "@azure/msal-react"
import { rankAt, type UpgradeId } from "@workspace/game-domain"
import { Badge } from "@workspace/ui/components/badge"
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
import type { EstimateOutcome } from "../model/estimate/estimate.domain"
import { useGoalCatalog } from "../model/use-goal-catalog"
import { FarmingStrategyField } from "./farming-strategy-field"
import { GoalEstimateSection } from "./goal-estimate-section"
import { GoalLocationsField } from "./goal-locations-field"
import { GoalProjectsField } from "./goal-projects-field"
import { StatusBadge } from "./status-badge"

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

  // Rank goals never expose a farming-location override (product decision — see the section's JSX
  // below); Unlock goals farm a shard, not an upgrade, so their location list comes from the
  // character's own catalog shardLocations rather than the (always-empty, for Unlock)
  // snapshot-derived upgrade requirement every other costed goal type uses.
  const isRank = detail?.goalType === "Rank"
  const isUnlock = detail?.goalType === "Unlock"
  const upgradeLocationGroups = useMemo(() => {
    if (!detail?.snapshot) return []
    return detail.snapshot.initialRequirement.map((resource) => ({
      resourceId: resource.resourceId,
      battleIds: [
        ...new Set(
          upgradesById
            .get(resource.resourceId as UpgradeId)
            ?.farmLocations.map((location) => location.battleId) ?? []
        ),
      ],
    }))
  }, [detail, upgradesById])
  const shardBattleIds = useMemo(() => {
    if (!detail || detail.goalType !== "Unlock") return []
    return [
      ...new Set(
        charactersById
          ?.get(detail.entityId)
          ?.shardLocations.map((location) => location.battleId) ?? []
      ),
    ]
  }, [detail, charactersById])
  const locationGroups = isUnlock
    ? shardBattleIds.length > 0
      ? [{ resourceId: "shards", battleIds: shardBattleIds }]
      : []
    : upgradeLocationGroups
  const allLocations = [
    ...new Set(locationGroups.flatMap((group) => group.battleIds)),
  ]
  const overrideValid =
    isRank ||
    selectedLocations.length === 0 ||
    locationGroups.every((group) =>
      group.battleIds.some((id) => selectedLocations.includes(id))
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
        farmingLocationIds: isRank
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
      <SheetContent className="overflow-y-auto" data-testid="goal-detail-sheet">
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
              {detail.milestones.length > 0 ? (
                <Badge variant="secondary">
                  {t("goals.milestones.count", {
                    completed: detail.milestones.filter(
                      (item) => item.status === "completed"
                    ).length,
                    total: detail.milestones.length,
                  })}
                </Badge>
              ) : null}
            </div>

            <GoalEstimateSection
              estimate={estimate}
              isolated={isolated}
              snapshot={detail.snapshot}
            />

            <section className="grid gap-2">
              <h3 className="font-semibold">
                {t("goals.detail.milestonesTitle")}
              </h3>
              {detail.milestones.length > 0 ? (
                <ol className="grid gap-2">
                  {detail.milestones.map((milestone) => (
                    <li className="rounded-xl border p-2" key={milestone.index}>
                      {milestone.targetState} · {milestone.status}
                      {milestone.completedAt
                        ? ` · ${new Date(milestone.completedAt).toLocaleDateString()}`
                        : ""}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-muted-foreground">
                  {t("goals.detail.none")}
                </p>
              )}
            </section>

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
                rankEnd={rankAt(detail.config.rank.end)}
                rankStart={rankAt(detail.config.rank.start)}
              />
            ) : null}

            {!isRank ? (
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

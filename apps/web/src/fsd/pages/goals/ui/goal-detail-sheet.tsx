import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import type { UpgradeId } from "@workspace/game-domain"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
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

import { goalQueries, updateGoal } from "@/entities/goal"
import { ApiError } from "@/shared/api"
import { useActiveAccountId } from "@/shared/auth"
import type { EstimateOutcome } from "../model/estimate/estimate.domain"
import { useGoalCatalog } from "../model/use-goal-catalog"
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
  const accountId = useActiveAccountId()
  const queryClient = useQueryClient()
  const { getEntityName, upgradesById } = useGoalCatalog()
  const [draftState, setDraftState] = useState<{
    key: string
    notes: string
    selectedLocations: string[]
  } | null>(null)
  const [saveError, setSaveError] = useState<{
    goalId: string
    message: string
  } | null>(null)
  const detailQuery = useQuery({
    ...goalQueries.detail(accountId ?? "anonymous", goalId ?? "unselected"),
    enabled: Boolean(accountId && goalId),
  })
  const detail = detailQuery.data ?? null
  const dependencyQueries = useQueries({
    queries: (detail?.dependsOn ?? []).map((id) => ({
      ...goalQueries.detail(accountId ?? "anonymous", id),
      enabled: Boolean(accountId),
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
        }
  const notes = draft.notes
  const selectedLocations = draft.selectedLocations

  const updateMutation = useMutation({
    mutationFn: (request: {
      goalId: string
      notes: string | null
      farmingLocationIds: string[] | null
    }) =>
      updateGoal(request.goalId, {
        notes: request.notes,
        farmingLocationIds: request.farmingLocationIds,
      }),
    onSuccess: async (updated) => {
      if (!accountId) return
      queryClient.setQueryData(
        goalQueries.detail(accountId, updated.goalId).queryKey,
        updated
      )
      await queryClient.invalidateQueries({
        queryKey: goalQueries.lists(accountId),
      })
      onUpdated()
    },
  })

  const locationGroups = useMemo(() => {
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
  const allLocations = [
    ...new Set(locationGroups.flatMap((group) => group.battleIds)),
  ]
  const overrideValid =
    selectedLocations.length === 0 ||
    locationGroups.every((group) =>
      group.battleIds.some((id) => selectedLocations.includes(id))
    )

  const save = async () => {
    if (!detail || !accountId || !overrideValid) return
    setSaveError(null)
    try {
      await updateMutation.mutateAsync({
        goalId: detail.goalId,
        notes: notes.trim() || null,
        farmingLocationIds:
          selectedLocations.length > 0 ? selectedLocations : null,
      })
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

            <section className="grid gap-2">
              <h3 className="font-semibold">
                {t("goals.detail.estimateTitle")}
              </h3>
              {isolated ? (
                <Badge variant="outline">
                  {t("goals.detail.isolatedEstimate")}
                </Badge>
              ) : null}
              <p>
                {t("goals.detail.originalEstimate")}:{" "}
                {detail.snapshot?.originalEstimateDays != null
                  ? `${detail.snapshot.originalEstimateDays}d · ${detail.snapshot.originalEstimateDate}`
                  : t("goals.detail.unavailable")}
              </p>
              <p>
                {t("goals.detail.currentEstimate")}:{" "}
                {estimate?.status === "Blocked"
                  ? t(`goals.estimate.blocked.${estimate.reason}`)
                  : estimate
                    ? `${estimate.days}d · ${estimate.date}`
                    : t("goals.detail.unavailable")}
              </p>
              {detail.snapshot ? (
                <p className="text-muted-foreground">
                  {t("goals.detail.originalResources", {
                    count: detail.snapshot.initialRequirement.reduce(
                      (sum, item) => sum + item.count,
                      0
                    ),
                    energy: detail.snapshot.originalEnergyTotal ?? "—",
                    raids: detail.snapshot.originalRaidsTotal ?? "—",
                  })}
                </p>
              ) : null}
            </section>

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

            <section className="grid gap-2">
              <h3 className="font-semibold">
                {t("goals.detail.farmingTitle")}
              </h3>
              <p className="text-muted-foreground">
                {t("goals.detail.farmingDescription")}
              </p>
              {allLocations.map((battleId) => (
                <label className="flex items-center gap-2" key={battleId}>
                  <Checkbox
                    checked={selectedLocations.includes(battleId)}
                    onCheckedChange={(checked) =>
                      setDraftState({
                        ...draft,
                        selectedLocations:
                          checked === true
                            ? [...selectedLocations, battleId]
                            : selectedLocations.filter((id) => id !== battleId),
                      })
                    }
                  />
                  {battleId}
                </label>
              ))}
              {!overrideValid ? (
                <p className="text-destructive">
                  {t("goals.detail.farmingInvalid")}
                </p>
              ) : null}
            </section>
          </div>
        ) : null}
        <SheetFooter>
          <Button
            disabled={!detail || updateMutation.isPending || !overrideValid}
            onClick={() => void save()}
          >
            {t("goals.detail.save")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

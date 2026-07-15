import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useMsal } from "@azure/msal-react"
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

import { getGoal, updateGoal, type GoalDetail } from "@/entities/goal"
import { ApiError } from "@/shared/api"
import type { EstimateOutcome } from "../model/estimate/estimate.domain"
import { useGoalCatalog } from "../model/use-goal-catalog"
import { StatusBadge } from "./status-badge"

export function GoalDetailSheet({
  goalId,
  estimate,
  onOpenChange,
  onUpdated,
}: {
  goalId: string | null
  estimate: EstimateOutcome | undefined
  onOpenChange: (open: boolean) => void
  onUpdated: () => void
}) {
  const { t } = useTranslation()
  const { instance, accounts } = useMsal()
  const account = instance.getActiveAccount() ?? accounts[0]
  const { getEntityName, upgradesById } = useGoalCatalog()
  const [detail, setDetail] = useState<GoalDetail | null>(null)
  const [dependencies, setDependencies] = useState<GoalDetail[]>([])
  const [notes, setNotes] = useState("")
  const [selectedLocations, setSelectedLocations] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!goalId || !account) return
    let active = true
    void getGoal(instance, account, goalId).then(
      async (value) => {
        if (!active) return
        setDetail(value)
        setError(null)
        setDependencies([])
        setNotes(value.notes ?? "")
        setSelectedLocations(value.config.farmingLocationIds ?? [])
        const loaded = await Promise.all(
          value.dependsOn.map((id) => getGoal(instance, account, id))
        )
        if (active) setDependencies(loaded)
      },
      (reason: unknown) =>
        active &&
        setError(
          reason instanceof ApiError
            ? reason.message
            : t("goals.detail.loadError")
        )
    )
    return () => {
      active = false
    }
  }, [goalId, account, instance, t])

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
    if (!detail || !account || !overrideValid) return
    setSaving(true)
    setError(null)
    try {
      const updated = await updateGoal(instance, account, detail.goalId, {
        notes: notes.trim() || null,
        farmingLocationIds:
          selectedLocations.length > 0 ? selectedLocations : null,
      })
      setDetail(updated)
      onUpdated()
    } catch (reason) {
      setError(
        reason instanceof ApiError
          ? reason.message
          : t("goals.detail.saveError")
      )
    } finally {
      setSaving(false)
    }
  }

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
                onChange={(event) => setNotes(event.target.value)}
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
                      setSelectedLocations((current) =>
                        checked === true
                          ? [...current, battleId]
                          : current.filter((id) => id !== battleId)
                      )
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
            disabled={!detail || saving || !overrideValid}
            onClick={() => void save()}
          >
            {t("goals.detail.save")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

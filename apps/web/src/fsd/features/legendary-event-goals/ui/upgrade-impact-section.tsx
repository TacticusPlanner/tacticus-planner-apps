import { useTranslation } from "react-i18next"
import { ChevronDown, Target } from "lucide-react"
import { characterIcon } from "@workspace/game-catalog"
import type { UnitId } from "@workspace/game-domain"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { cn } from "@workspace/ui/lib/utils"

import { UnitGoalBadge, useCreateGoalLauncher } from "@/entities/goal"
import type {
  LegendaryEventGoalTarget,
  LegendaryEventLaneId,
  UpgradeImpactRow,
} from "@/entities/legendary-event"
import { useAnalyticsActions } from "@/shared/analytics"
import { usePersistedSelection } from "@/shared/lib"
import { EntityIcon } from "@/shared/ui"

import {
  prefillGoalType,
  stepInGoals,
  upgradeStepPrefill,
} from "../model/create-goal-prefill"
import type { UpgradeImpactState } from "../model/upgrade-impact-state"
import { useGoalLabels } from "../model/use-goal-labels"

export const UPGRADE_IMPACT_OPEN_KEY = "legendaryEvents.upgradeImpact.open"
const isOpenState = (value: unknown): value is "open" | "closed" =>
  value === "open" || value === "closed"

/**
 * A lane tab's Upgrade impact (spec: Upgrade impact section on a lane tab), after Teams: collapsed
 * by default with its open state remembered per device, a header summary derived from the rows,
 * then one row per next step that adds points (unit, step, team depth changes, gain) with Create
 * goal, or "In goals" when an Active goal already reaches the step.
 */
export function UpgradeImpactSection({
  eventId,
  laneId,
  state,
  layout,
  nameOf,
  teamName,
  goalTargets,
}: {
  eventId: string
  laneId: LegendaryEventLaneId
  state: UpgradeImpactState
  layout: "table" | "list"
  nameOf: (unitId: string) => string
  teamName: (teamId: string) => string
  /** The event's goal targets by unit; undefined while goals load or failed. */
  goalTargets: ReadonlyMap<string, LegendaryEventGoalTarget> | undefined
}) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const number = new Intl.NumberFormat(i18n.language)
  const labels = useGoalLabels()
  const launch = useCreateGoalLauncher()
  const { captureEvent } = useAnalyticsActions()
  const [openState, setOpenState] = usePersistedSelection(
    UPGRADE_IMPACT_OPEN_KEY,
    isOpenState,
    "closed"
  )
  const open = openState === "open"
  const rows = state.kind === "ready" ? state.impact.rows : []
  const bodyId = `legendary-event-upgrade-impact-body-${laneId}`

  const summary = (() => {
    switch (state.kind) {
      case "loading":
        return t("upgradeImpact.loading")
      case "noTeams":
        return t("upgradeImpact.noTeams")
      case "needsEstimates":
        return t("upgradeImpact.needsEstimates")
      case "ready":
        return rows.length === 0
          ? t("upgradeImpact.noRows")
          : t("upgradeImpact.summary", {
              count: rows.length,
              best: number.format(rows[0]!.gainPoints),
            })
    }
  })()

  const toggle = () => {
    const next = !open
    setOpenState(next ? "open" : "closed")
    if (next) {
      captureEvent({
        type: "legendary_event_upgrade_impact_expanded",
        eventId,
        laneId,
        rowCount: rows.length,
      })
    }
  }

  const createGoal = (row: UpgradeImpactRow) => {
    const prefill = upgradeStepPrefill(row.unitId, row.step)
    captureEvent({
      type: "legendary_event_create_goal_opened",
      eventId,
      laneId,
      source: "upgradeImpact",
      goalType: prefillGoalType(prefill),
    })
    launch(prefill)
  }

  const teamChanges = (row: UpgradeImpactRow) =>
    row.teams.map((team) =>
      t("upgradeImpact.teamChange", {
        team: teamName(team.teamId),
        from: team.depthBefore,
        to: team.depthAfter,
      })
    )

  const action = (row: UpgradeImpactRow, compact: boolean) => {
    if (goalTargets && stepInGoals(row.step, goalTargets.get(row.unitId))) {
      return (
        <span
          className="text-xs text-muted-foreground"
          data-testid="upgrade-impact-in-goals"
        >
          {t("upgradeImpact.inGoals")}
        </span>
      )
    }
    const name = nameOf(row.unitId)
    return compact ? (
      <Button
        aria-label={t("upgradeImpact.createGoalFor", { name })}
        className="size-11"
        data-testid="upgrade-impact-create-goal"
        onClick={() => createGoal(row)}
        size="icon"
        variant="outline"
      >
        <Target />
      </Button>
    ) : (
      <Button
        aria-label={t("upgradeImpact.createGoalFor", { name })}
        data-testid="upgrade-impact-create-goal"
        onClick={() => createGoal(row)}
        size="sm"
        variant="outline"
      >
        <Target />
        {t("upgradeImpact.createGoal")}
      </Button>
    )
  }

  const unit = (row: UpgradeImpactRow) => (
    <span className="flex min-w-0 items-center gap-2">
      <EntityIcon
        alt=""
        className="size-8 shrink-0 rounded-full"
        src={characterIcon(row.unitId as UnitId)}
      />
      <span className="truncate font-medium">{nameOf(row.unitId)}</span>
      <UnitGoalBadge
        label={t("goalBadge.label")}
        lines={labels.badgeLines(goalTargets?.get(row.unitId))}
      />
    </span>
  )

  let body = null
  if (open) {
    if (state.kind === "loading") {
      body = <Skeleton className="h-24 w-full rounded-xl" />
    } else if (state.kind === "ready" && rows.length > 0) {
      body =
        layout === "table" ? (
          <div className="min-w-0 overflow-x-auto rounded-lg border">
            <Table data-testid="upgrade-impact-table">
              <TableHeader>
                <TableRow>
                  <TableHead>{t("upgradeImpact.unit")}</TableHead>
                  <TableHead>{t("upgradeImpact.step")}</TableHead>
                  <TableHead>{t("upgradeImpact.teams")}</TableHead>
                  <TableHead className="text-right">
                    {t("upgradeImpact.points")}
                  </TableHead>
                  <TableHead>
                    <span className="sr-only">
                      {t("upgradeImpact.createGoal")}
                    </span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow
                    data-step={row.step.kind}
                    data-testid="upgrade-impact-row"
                    data-unit={row.unitId}
                    key={`${row.unitId}:${row.step.kind}`}
                  >
                    <TableCell className="max-w-48">{unit(row)}</TableCell>
                    <TableCell data-testid="upgrade-impact-step">
                      {labels.step(row.step)}
                    </TableCell>
                    <TableCell
                      className="text-muted-foreground"
                      data-testid="upgrade-impact-teams"
                    >
                      {teamChanges(row).join(", ")}
                    </TableCell>
                    <TableCell
                      className="text-right font-semibold tabular-nums"
                      data-testid="upgrade-impact-gain"
                    >
                      {t("upgradeImpact.gain", {
                        points: number.format(row.gainPoints),
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      {action(row, false)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <ul
            className="flex min-w-0 flex-col gap-2"
            data-testid="upgrade-impact-list"
          >
            {rows.map((row) => (
              <li
                className="flex min-w-0 items-center gap-2 rounded-xl border p-2.5"
                data-step={row.step.kind}
                data-testid="upgrade-impact-row"
                data-unit={row.unitId}
                key={`${row.unitId}:${row.step.kind}`}
              >
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex min-w-0 items-center justify-between gap-2">
                    {unit(row)}
                    <span
                      className="shrink-0 text-sm"
                      data-testid="upgrade-impact-step"
                    >
                      {labels.step(row.step)}
                    </span>
                  </div>
                  <div className="flex min-w-0 items-center justify-between gap-2 text-sm">
                    <span
                      className="truncate text-muted-foreground"
                      data-testid="upgrade-impact-teams"
                    >
                      {teamChanges(row).join(", ")}
                    </span>
                    <span
                      className="shrink-0 font-semibold tabular-nums"
                      data-testid="upgrade-impact-gain"
                    >
                      {t("upgradeImpact.gain", {
                        points: number.format(row.gainPoints),
                      })}
                    </span>
                  </div>
                </div>
                {action(row, true)}
              </li>
            ))}
          </ul>
        )
    }
  }

  return (
    <section
      aria-labelledby={`legendary-event-upgrade-impact-title-${laneId}`}
      className="flex min-w-0 flex-col gap-3"
      data-lane={laneId}
      data-state={state.kind}
      data-testid="legendary-event-upgrade-impact-section"
    >
      <div
        className="flex min-w-0 flex-col gap-0.5"
        data-testid="legendary-event-upgrade-impact"
      >
        <h2
          className="text-lg font-semibold"
          id={`legendary-event-upgrade-impact-title-${laneId}`}
        >
          <button
            aria-controls={bodyId}
            aria-expanded={open}
            className="flex w-full min-w-0 items-center justify-between gap-3 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
            data-testid="upgrade-impact-toggle"
            onClick={toggle}
            title={t("upgradeImpact.toggle")}
            type="button"
          >
            {t("upgradeImpact.title")}
            <ChevronDown
              aria-hidden
              className={cn(
                "size-5 shrink-0 transition-transform",
                open && "rotate-180"
              )}
            />
          </button>
        </h2>
        <p
          className="text-sm text-muted-foreground"
          data-testid="upgrade-impact-summary"
        >
          {summary}
        </p>
      </div>
      <div hidden={!open} id={bodyId}>
        {open ? (
          <div className="flex min-w-0 flex-col gap-2">
            <p className="text-xs text-muted-foreground">
              {t("upgradeImpact.hint")}
            </p>
            {body}
          </div>
        ) : null}
      </div>
    </section>
  )
}

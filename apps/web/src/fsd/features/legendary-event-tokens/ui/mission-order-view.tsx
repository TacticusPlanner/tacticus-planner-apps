import { useTranslation } from "react-i18next"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"
import { cn } from "@workspace/ui/lib/utils"

import {
  useMissionLabel,
  type LegendaryEventMissionRef,
} from "@/entities/legendary-event"

import type { RunMissionSummary, TokenMissionStep } from "../lib/mission-order"

export type TokenPlanOrder = "points" | "missions"

/** The Token plan's Points / Missions switch (spec: Missions order). */
export function TokenPlanOrderSwitch({
  order,
  onChange,
}: {
  order: TokenPlanOrder
  onChange: (order: TokenPlanOrder) => void
}) {
  const { t } = useTranslation("legendaryEvents")
  return (
    <div className="flex items-center gap-2 text-sm">
      <span id="token-plan-order-label">{t("tokenPlan.plan.order.label")}</span>
      <ToggleGroup
        aria-labelledby="token-plan-order-label"
        onValueChange={(value) => {
          if (value === "points" || value === "missions") onChange(value)
        }}
        size="sm"
        type="single"
        value={order}
        variant="outline"
      >
        <ToggleGroupItem className="min-h-9 px-3" value="points">
          {t("tokenPlan.plan.order.points")}
        </ToggleGroupItem>
        <ToggleGroupItem className="min-h-9 px-3" value="missions">
          {t("tokenPlan.plan.order.missions")}
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  )
}

function useRefLabel() {
  const { t } = useTranslation("legendaryEvents")
  const missionLabel = useMissionLabel()
  return (entry: LegendaryEventMissionRef) =>
    entry.track === "premium"
      ? t("tokenPlan.nextToken.missions.premium", {
          mission: missionLabel(entry.mission),
        })
      : missionLabel(entry.mission)
}

/** A run's open missions and the token that finishes each, at the top of its section. */
export function RunMissionsSummary({
  summary,
}: {
  summary: RunMissionSummary
}) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const number = new Intl.NumberFormat(i18n.language)
  const label = useRefLabel()
  if (summary.missions.length === 0 && summary.untracked.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        {t("tokenPlan.plan.missions.none")}
      </p>
    )
  }
  return (
    <section
      aria-label={t("tokenPlan.plan.missions.title")}
      className="flex flex-col gap-1 rounded-lg bg-muted/50 p-2 text-xs"
    >
      <h4 className="font-semibold">{t("tokenPlan.plan.missions.title")}</h4>
      <ul className="flex flex-col gap-0.5">
        {summary.missions.map((entry) => {
          const status =
            entry.doneAt === null
              ? entry.reached === 0
                ? t("tokenPlan.plan.missions.notReached")
                : t("tokenPlan.plan.missions.reached", {
                    reached: number.format(entry.reached),
                    needed: number.format(entry.needed),
                  })
              : t("tokenPlan.plan.missions.doneAt", {
                  token: entry.doneAt + 1,
                })
          return (
            <li
              className="flex flex-wrap justify-between gap-x-3"
              key={`${entry.ref.track}${entry.ref.mission.index}`}
            >
              <span>{label(entry.ref)}</span>
              <span
                className={cn(
                  "tabular-nums",
                  entry.doneAt === null
                    ? "text-muted-foreground"
                    : "font-medium text-primary"
                )}
              >
                {entry.estimate
                  ? `${t("tokenPlan.plan.missions.estimate")} ${status}`
                  : status}
              </span>
            </li>
          )
        })}
      </ul>
      {summary.untracked.length > 0 ? (
        <p className="text-muted-foreground">
          {t("tokenPlan.plan.missions.untracked", {
            missions: summary.untracked.map(label).join(" · "),
          })}
        </p>
      ) : null}
    </section>
  )
}

/** Under a token row: the open missions it moves, and a line for each it finishes. */
export function TokenMissionSteps({
  steps,
}: {
  steps: readonly TokenMissionStep[]
}) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const number = new Intl.NumberFormat(i18n.language)
  const label = useRefLabel()
  if (steps.length === 0) return null
  const progressing = steps.filter((step) => !step.completes)
  const completing = steps.filter((step) => step.completes)
  return (
    <div className="flex flex-col gap-0.5 text-xs">
      {progressing.length > 0 ? (
        <p className="text-muted-foreground tabular-nums">
          {progressing
            .map((step) =>
              t("tokenPlan.plan.missions.step", {
                mission: label(step.ref),
                total: number.format(step.total),
                needed: number.format(step.needed),
              })
            )
            .join(" · ")}
        </p>
      ) : null}
      {completing.map((step) => (
        <p
          className="font-medium text-primary"
          key={`${step.ref.track}${step.ref.mission.index}`}
        >
          {t("tokenPlan.plan.missions.completes", {
            mission: label(step.ref),
          })}
        </p>
      ))}
    </div>
  )
}

import { useTranslation } from "react-i18next"
import { ChevronDown } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import {
  useObjectiveLabel,
  type LegendaryEvent,
} from "@/entities/legendary-event"
import { useAnalyticsActions } from "@/shared/analytics"

import type { TokenMarker } from "../lib/run-forecast"
import { groupTokensByTeam } from "../lib/token-groups"
import type { LaneFullClear, TokenPlanView } from "../lib/token-plan-view"
import { useStoredOpen } from "../model/use-stored-open"
import { TokenObjectives } from "./token-objectives"

const OPEN_KEY = "legendaryEvents.tokenPlan.open"
const REGION_ID = "legendary-event-token-plan-list"

/**
 * The Overview's collapsible Token plan (spec: Token plan list): every planned token grouped by
 * consecutive team, with running points, milestone and step markers and the Maybe flag, then one
 * fewest-tokens line per lane. Hidden while the plan is empty or not ready.
 */
export function TokenPlanList({
  eventId,
  event,
  view,
  isMobile,
}: {
  eventId: string
  event: Pick<LegendaryEvent, "alpha" | "beta" | "gamma">
  view: TokenPlanView
  isMobile: boolean
}) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const { captureEvent } = useAnalyticsActions()
  const [open, setOpen] = useStoredOpen(OPEN_KEY)
  if (view.kind !== "ready" || view.plan.tokens.length === 0) return null
  const number = new Intl.NumberFormat(i18n.language)
  const { plan } = view
  const markers = view.forecast?.markers ?? []

  const toggle = () => {
    if (!open) {
      captureEvent({
        type: "legendary_event_token_plan_expanded",
        eventId,
        planLength: plan.tokens.length,
      })
    }
    setOpen(!open)
  }

  return (
    <section
      aria-labelledby="legendary-event-token-plan-title"
      className="flex min-w-0 flex-col gap-2 rounded-xl border bg-card p-3"
      data-testid="legendary-event-token-plan"
    >
      <h2
        data-testid="legendary-event-token-plan-header"
        id="legendary-event-token-plan-title"
      >
        <Button
          aria-controls={REGION_ID}
          aria-expanded={open}
          className="h-auto w-full justify-between px-1 py-1 text-left whitespace-normal"
          data-testid="token-plan-toggle"
          onClick={toggle}
          type="button"
          variant="ghost"
        >
          <span className="flex min-w-0 flex-wrap items-baseline gap-x-3">
            <span className="text-base font-semibold">
              {t("tokenPlan.plan.title")}
            </span>
            <span
              className="text-sm font-normal text-muted-foreground tabular-nums"
              data-testid="token-plan-summary"
            >
              {t("tokenPlan.plan.summary", {
                count: plan.tokens.length,
                points: number.format(plan.totalPoints),
              })}
            </span>
          </span>
          <ChevronDown
            aria-hidden="true"
            className={cn("transition-transform", open && "rotate-180")}
          />
        </Button>
      </h2>
      {open ? (
        <div className="flex min-w-0 flex-col gap-3" id={REGION_ID}>
          <ol className="flex min-w-0 flex-col gap-3">
            {groupTokensByTeam(plan.tokens).map((group) => (
              <li
                className="flex min-w-0 flex-col gap-1"
                data-team={group.teamId}
                data-testid="token-plan-group"
                key={group.start}
              >
                <h3 className="text-sm font-semibold">{group.teamName}</h3>
                <ol className="flex min-w-0 flex-col divide-y">
                  {group.tokens.map((token, offset) => {
                    const index = group.start + offset
                    return (
                      <TokenRow
                        event={event}
                        index={index}
                        isMobile={isMobile}
                        key={index}
                        marker={markers[index]}
                        token={token}
                      />
                    )
                  })}
                </ol>
              </li>
            ))}
          </ol>
          {view.fullClear.length > 0 ? (
            <ul className="flex flex-col gap-0.5 text-xs text-muted-foreground">
              {view.fullClear.map((entry) => (
                <FullClearLine entry={entry} event={event} key={entry.laneId} />
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}

function TokenRow({
  event,
  token,
  index,
  marker,
  isMobile,
}: {
  event: Pick<LegendaryEvent, "alpha" | "beta" | "gamma">
  token: Extract<TokenPlanView, { kind: "ready" }>["plan"]["tokens"][number]
  index: number
  marker: TokenMarker | undefined
  isMobile: boolean
}) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const number = new Intl.NumberFormat(i18n.language)
  const lane = t(`lanes.${token.laneId}`)
  const battle = t("tokenPlan.plan.battle", { battle: token.battleIndex + 1 })
  const points = (
    <span className="font-medium tabular-nums">
      {t("tokenPlan.plan.points", { points: number.format(token.points) })}
    </span>
  )
  const running = (
    <span className="text-muted-foreground tabular-nums">
      {t("tokenPlan.plan.running", {
        points: number.format(token.runningPoints),
      })}
    </span>
  )
  const objectives = (
    <TokenObjectives
      clearedIds={token.clearedIds}
      compact
      lane={event[token.laneId]}
    />
  )
  const maybe = token.maybe ? (
    <span
      className="text-xs text-amber-700 dark:text-amber-400"
      data-testid="token-plan-maybe"
    >
      {t("tokenPlan.plan.maybe")}
    </span>
  ) : null

  return (
    <li
      className="flex min-w-0 flex-col gap-1 py-1.5 text-sm"
      data-index={index}
      data-testid="token-plan-row"
    >
      {isMobile ? (
        <>
          <div className="flex min-w-0 items-baseline justify-between gap-2">
            <span className="min-w-0 truncate">
              <span className="text-muted-foreground tabular-nums">
                {index + 1}.
              </span>{" "}
              {lane} · {battle}
            </span>
            {points}
          </div>
          <div className="flex min-w-0 items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-2">
              {objectives}
              {maybe}
            </span>
            {running}
          </div>
        </>
      ) : (
        <div className="grid min-w-0 grid-cols-[2rem_4.5rem_5.5rem_minmax(0,1fr)_4rem_6.5rem] items-center gap-2">
          <span className="text-muted-foreground tabular-nums">
            {index + 1}
          </span>
          <span>{lane}</span>
          <span>{battle}</span>
          <span className="flex min-w-0 items-center gap-2">
            {objectives}
            {maybe}
          </span>
          <span className="text-right">{points}</span>
          <span className="text-right">{running}</span>
        </div>
      )}
      {marker && (marker.milestones.length > 0 || marker.steps.length > 0) ? (
        <ul
          className="flex flex-wrap gap-x-3 text-xs font-medium text-primary"
          data-testid="token-plan-marker"
        >
          {marker.milestones.map((entry) => (
            <li key={`m${entry.milestone}`}>
              {t("tokenPlan.plan.milestone", {
                milestone: entry.milestone,
                currency: number.format(entry.payout),
              })}
            </li>
          ))}
          {marker.steps.map((step) => (
            <li key={step}>
              {t("tokenPlan.plan.step", { step: t(`outlook.steps.${step}`) })}
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  )
}

function FullClearLine({
  entry,
  event,
}: {
  entry: LaneFullClear
  event: Pick<LegendaryEvent, "alpha" | "beta" | "gamma">
}) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const objectiveLabel = useObjectiveLabel()
  const lane = t(`lanes.${entry.laneId}`)
  if (entry.figure.kind === "tokensPerBattle") {
    return (
      <li data-lane={entry.laneId} data-testid="token-plan-full-clear">
        {t("tokenPlan.plan.fullClear", { lane, count: entry.figure.tokens })}
      </li>
    )
  }
  const names = entry.figure.objectiveIndexes.flatMap((index) => {
    const objective = event[entry.laneId].unitsRestrictions.find(
      (candidate) => candidate.index === index
    )
    return objective ? [objectiveLabel(objective).label] : []
  })
  return (
    <li data-lane={entry.laneId} data-testid="token-plan-full-clear">
      {t("tokenPlan.plan.uncovered", {
        lane,
        objectives: new Intl.ListFormat(i18n.language, {
          style: "short",
          type: "unit",
        }).format(names),
      })}
    </li>
  )
}

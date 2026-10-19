import { useTranslation } from "react-i18next"
import { ChevronDown } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import {
  useObjectiveLabel,
  type LegendaryEvent,
} from "@/entities/legendary-event"
import { useAnalyticsActions } from "@/shared/analytics"

import type { LaneFullClear, TokenPlanView } from "../lib/token-plan-view"
import { useStoredOpen } from "../model/use-stored-open"
import { RunSection, RunSectionHeader, TokenGroups } from "./token-plan-rows"

const OPEN_KEY = "legendaryEvents.tokenPlan.open"
const REGION_ID = "legendary-event-token-plan-list"

/**
 * The Overview's collapsible Token plan (spec: Token plan list): every planned token in run
 * sections (as the forecast spends them, then the tokens no run covers), grouped by consecutive team, with running points, milestone and step markers and the Maybe flag, then one
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
          {view.byRun ? (
            <ol className="flex min-w-0 flex-col gap-4">
              {view.byRun.sections.map((section) => (
                <RunSection
                  header={<RunSectionHeader plan={plan} section={section} />}
                  key={`run${section.run}`}
                  testId="token-plan-run-section"
                >
                  {section.count === 0 ? (
                    <p
                      className="text-sm text-muted-foreground"
                      data-testid="token-plan-run-empty"
                    >
                      {t("tokenPlan.plan.byRun.empty", {
                        count: section.available,
                      })}
                    </p>
                  ) : (
                    <TokenGroups
                      count={section.count}
                      event={event}
                      isMobile={isMobile}
                      markers={markers}
                      start={section.start}
                      tokens={plan.tokens}
                    />
                  )}
                </RunSection>
              ))}
              {view.byRun.overflow ? (
                <RunSection
                  header={
                    <h3 className="text-sm font-semibold">
                      {t("tokenPlan.plan.byRun.overflow", {
                        count: view.byRun.overflow.count,
                        run: view.byRun.sections.at(-1)?.unknownRun
                          ? undefined
                          : view.byRun.sections.at(-1)?.run,
                        context: view.byRun.sections.at(-1)?.unknownRun
                          ? "unknown"
                          : undefined,
                      })}
                    </h3>
                  }
                  testId="token-plan-overflow"
                >
                  <TokenGroups
                    count={view.byRun.overflow.count}
                    event={event}
                    isMobile={isMobile}
                    markers={markers}
                    start={view.byRun.overflow.start}
                    tokens={plan.tokens}
                  />
                </RunSection>
              ) : null}
            </ol>
          ) : (
            <TokenGroups
              count={plan.tokens.length}
              event={event}
              isMobile={isMobile}
              markers={markers}
              start={0}
              tokens={plan.tokens}
            />
          )}
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

import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { ChevronDown } from "lucide-react"
import { legendaryEventResourceIcon } from "@workspace/game-catalog"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"

import { useAnalyticsActions } from "@/shared/analytics"
import { IconLine } from "@/shared/ui"

import type { RunForecast } from "../lib/run-forecast"
import type { TokenPlanView } from "../lib/token-plan-view"
import { useStoredOpen } from "../model/use-stored-open"
import type { OpenTeamsHandler } from "./next-token-card"

const tokensIcon = legendaryEventResourceIcon("tokens")
const pointsIcon = legendaryEventResourceIcon("points")
const chestsIcon = legendaryEventResourceIcon("chests")
const shardsIcon = legendaryEventResourceIcon("shards")

const OPEN_KEY = "legendaryEvents.runForecast.open"
const REGION_ID = "legendary-event-run-forecast-runs"

/**
 * The Overview's collapsible Run forecast (spec: Run forecast section): headed by the last run's
 * outcome; expanded, one block per run with its supply, use and ending figures, the leftover-tokens
 * line and Edit inputs (`editInputs`, the run inputs drawer the page renders). Hidden on an archived
 * event, signed out, without synced progress or the event's reward ladder.
 */
export function RunForecastSection({
  eventId,
  view,
  isMobile,
  editInputs,
  onOpenTeams,
  openKey = OPEN_KEY,
  defaultOpen = false,
  trackExpand = true,
}: {
  eventId: string
  view: TokenPlanView
  isMobile: boolean
  editInputs: ReactNode
  onOpenTeams: OpenTeamsHandler
  /** Where the open state is remembered; another page keeps its own. */
  openKey?: string
  defaultOpen?: boolean
  /** Report expanding it to analytics (the event page's sections do). */
  trackExpand?: boolean
}) {
  const { t } = useTranslation("legendaryEvents")
  const { captureEvent } = useAnalyticsActions()
  const [open, setOpen] = useStoredOpen(openKey, defaultOpen)
  if (view.kind === "loading") {
    return (
      <div data-testid="legendary-event-run-forecast-loading">
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    )
  }
  if (view.kind !== "ready" || !view.forecast) return null
  const { runs } = view.forecast
  const last = runs.at(-1)
  if (!last) return null

  const toggle = () => {
    if (!open && trackExpand) {
      captureEvent({ type: "legendary_event_run_forecast_expanded", eventId })
    }
    setOpen(!open)
  }

  return (
    <section
      aria-labelledby="legendary-event-run-forecast-title"
      className="flex min-w-0 flex-col gap-2 rounded-xl border bg-card p-3"
      data-testid="legendary-event-run-forecast"
    >
      <h2 id="legendary-event-run-forecast-title">
        <Button
          aria-controls={REGION_ID}
          aria-expanded={open}
          className="h-auto w-full justify-between px-1 py-1 text-left whitespace-normal"
          data-testid="run-forecast-toggle"
          onClick={toggle}
          type="button"
          variant="ghost"
        >
          <span className="flex min-w-0 flex-wrap items-baseline gap-x-3">
            <span className="text-base font-semibold">
              {t("tokenPlan.forecast.title")}
            </span>
            <span
              className="text-sm font-normal text-muted-foreground"
              data-testid="run-forecast-header"
            >
              <ForecastHeader last={last} />
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
          <ol className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-3">
            {runs.map((run) => (
              <RunBlock isMobile={isMobile} key={run.run} run={run} />
            ))}
          </ol>
          {view.leftover ? (
            <LeftoverLine
              laneId={view.leftover.laneId}
              onOpenTeams={onOpenTeams}
              tokens={view.leftover.tokens}
            />
          ) : null}
          <div>{editInputs}</div>
        </div>
      ) : null}
    </section>
  )
}

/** "By the end of run N: …", or "By the end of the next run: …" when the run is unknown. */
function ForecastHeader({ last }: { last: RunForecast }) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const number = new Intl.NumberFormat(i18n.language)
  const unknown = last.supply.unknownRun
  const points = number.format(last.endingPoints)
  if (last.next.step === "fullyAscended") {
    return unknown
      ? t("tokenPlan.forecast.headerAllStepsUnknown", { points })
      : t("tokenPlan.forecast.headerAllSteps", { run: last.run, points })
  }
  const step = t(`outlook.steps.${last.next.step}`)
  const shards = number.format(last.shardsMissing)
  return unknown
    ? t("tokenPlan.forecast.headerUnknown", { points, step, shards })
    : t("tokenPlan.forecast.header", { run: last.run, points, step, shards })
}

function RunBlock({ run, isMobile }: { run: RunForecast; isMobile: boolean }) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const number = new Intl.NumberFormat(i18n.language)
  const title = (
    <span className="flex items-baseline gap-2">
      <span className="font-semibold">
        {run.supply.unknownRun
          ? t("tokenPlan.forecast.nextRun")
          : t("tokenPlan.forecast.run", { run: run.run })}
      </span>
      {run.supply.unknownRun ? null : (
        <span
          className="text-xs text-muted-foreground"
          data-testid="run-forecast-state"
        >
          {t(`tokenPlan.forecast.states.${run.state}`)}
        </span>
      )}
    </span>
  )
  const body =
    run.state === "done" ? (
      <p className="text-sm text-muted-foreground">
        {t("tokenPlan.forecast.finished")}
      </p>
    ) : (
      <ul className="flex flex-col gap-0.5 text-sm">
        <IconLine icon={tokensIcon} testId="run-forecast-supply">
          {t("tokenPlan.forecast.supply", {
            total: run.supply.total,
            free: run.supply.free,
            ad: run.supply.ad,
            bonus: run.supply.bonusDelivery,
          })}
        </IconLine>
        <li data-testid="run-forecast-uses">
          {t("tokenPlan.forecast.uses", {
            used: run.tokensUsed,
            left: run.tokensLeftOver,
          })}
        </li>
        <IconLine icon={pointsIcon} testId="run-forecast-points">
          {t("tokenPlan.forecast.points", {
            points: number.format(run.endingPoints),
            earned: number.format(run.pointsEarned),
          })}
        </IconLine>
        <li>
          {t("tokenPlan.forecast.currency", {
            currency: number.format(run.endingCurrency),
            earned: number.format(run.currencyEarned),
          })}
        </li>
        <IconLine icon={chestsIcon}>
          {t("tokenPlan.forecast.chests", {
            claimed: run.chestsClaimed,
            opened: run.chestsOpened,
          })}
        </IconLine>
        <IconLine icon={shardsIcon}>
          {t("tokenPlan.forecast.shards", {
            shards: number.format(run.endingShards),
          })}
        </IconLine>
        {run.stepsReached.length > 0 ? (
          <li data-testid="run-forecast-reached">
            {t("tokenPlan.forecast.reached", {
              steps: run.stepsReached
                .map((step) => t(`outlook.steps.${step}`))
                .join(", "),
            })}
          </li>
        ) : null}
        <li data-testid="run-forecast-next">
          {run.next.step === "fullyAscended"
            ? t("tokenPlan.forecast.allSteps")
            : t("tokenPlan.forecast.next", {
                step: t(`outlook.steps.${run.next.step}`),
                shards: number.format(run.shardsMissing),
              })}
        </li>
        {run.ohSoClose ? (
          <li data-testid="run-forecast-oh-so-close">
            {t("tokenPlan.forecast.ohSoClose", {
              shards: run.ohSoClose.shards,
              blackstone: number.format(run.ohSoClose.blackstone),
            })}
          </li>
        ) : null}
      </ul>
    )

  if (isMobile) {
    return (
      <li
        className="rounded-lg border p-2"
        data-run={run.run}
        data-testid="run-forecast-run"
      >
        <details open={run.state === "now" || run.state === "next"}>
          <summary className="flex cursor-pointer items-baseline justify-between gap-2">
            {title}
            <span className="text-sm tabular-nums">
              {number.format(run.endingPoints)}
            </span>
          </summary>
          <div className="pt-2">{body}</div>
        </details>
      </li>
    )
  }
  return (
    <li
      className="flex flex-col gap-2 rounded-lg border p-3"
      data-run={run.run}
      data-testid="run-forecast-run"
    >
      {title}
      {body}
    </li>
  )
}

function LeftoverLine({
  tokens,
  laneId,
  onOpenTeams,
}: {
  tokens: number
  laneId: Parameters<OpenTeamsHandler>[0] | null
  onOpenTeams: OpenTeamsHandler
}) {
  const { t } = useTranslation("legendaryEvents")
  const text = t("tokenPlan.forecast.leftover", { count: tokens })
  if (!laneId) {
    return (
      <p
        className="text-sm text-muted-foreground"
        data-testid="run-forecast-leftover"
      >
        {text}
      </p>
    )
  }
  return (
    <Button
      className="h-auto self-start px-0 text-left whitespace-normal"
      data-lane={laneId}
      data-testid="run-forecast-leftover"
      onClick={() => onOpenTeams(laneId)}
      type="button"
      variant="link"
    >
      {text}
    </Button>
  )
}

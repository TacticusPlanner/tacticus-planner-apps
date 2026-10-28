import { useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Info } from "lucide-react"
import { PL_MEDIUM } from "@workspace/game-catalog"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
import { cn } from "@workspace/ui/lib/utils"

import { eventBarClass } from "@/shared/lib"
import { EventIcon, EventTypeIcon } from "@/shared/ui"

import type {
  HseDetailsView,
  HseEventPointsState,
  HseInstance,
} from "../model/hse-event-points"
import { MilestoneGrid } from "./milestone-grid"
import { useHseText } from "./use-hse-text"

/**
 * The selected instance's event details, after V1's Learn > HSEs page without paid offers: icon and
 * name, the power level and resolved tier (with the tier rules in a tooltip) when the event has more
 * than one tier, the description lines, a community note for a Global event, and the milestone grid.
 * On mobile the description shows its first line with Show more.
 */
export function EventDetails({
  state,
  eventName,
  entry,
  pointsIcon,
  className,
}: {
  state: HseEventPointsState
  eventName: string
  /** The shown instance, for its game medallion; none keeps the generic HSE icon. */
  entry?: HseInstance["entry"]
  /** The event's points icon, beside each milestone's points. */
  pointsIcon?: string
  className?: string
}) {
  const { t } = useTranslation("dailies")
  if (state.status === "none") return null

  const body = (() => {
    switch (state.status) {
      case "loading":
        return (
          <div className="flex min-h-12 items-center">
            <Spinner className="size-5" />
          </div>
        )
      case "error":
        return (
          <Alert data-testid="hse-event-details-error" variant="destructive">
            <AlertDescription>{t("hse.details.error")}</AlertDescription>
          </Alert>
        )
      case "no-data":
        return (
          <p
            className="text-sm text-muted-foreground"
            data-testid="hse-event-details-no-data"
          >
            {t("hse.details.noData")}
          </p>
        )
      case "ready":
        return <ReadyDetails details={state.details} pointsIcon={pointsIcon} />
    }
  })()

  return (
    <section
      className={cn("space-y-3 rounded-xl border p-4", className)}
      data-testid="hse-event-details"
    >
      <div className="flex items-center gap-3">
        {entry ? (
          <EventIcon
            className="size-10 shrink-0"
            definitionId={entry.definitionId}
            definitionType="HomeScreenEvent"
            parameters={entry.parameters ?? null}
          />
        ) : (
          <span
            aria-hidden="true"
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-lg",
              eventBarClass("homeScreen")
            )}
          >
            <EventTypeIcon
              className="size-4"
              definitionType="HomeScreenEvent"
            />
          </span>
        )}
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">
            {t("hse.details.title")}
          </p>
          <h2 className="truncate font-semibold">{eventName}</h2>
        </div>
      </div>
      {body}
    </section>
  )
}

function ReadyDetails({
  details,
  pointsIcon,
}: {
  details: HseDetailsView
  pointsIcon?: string
}) {
  const { t } = useTranslation("dailies")
  return (
    <>
      {details.hasTierChoice && details.playerTier ? (
        <TierLine details={details} />
      ) : null}
      {details.scope === "Global" ? (
        <p className="text-sm" data-testid="hse-event-details-global">
          {t("hse.details.global")}
        </p>
      ) : null}
      <Description details={details} />
      <MilestoneGrid pointsIcon={pointsIcon} tier={details.tier} />
    </>
  )
}

function TierLine({ details }: { details: HseDetailsView }) {
  const { t } = useTranslation("dailies")
  const rules = t("hse.details.tierRulesLabel")
  return (
    <div
      className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm"
      data-testid="hse-event-details-tier"
    >
      <span className="tabular-nums">
        {t("hse.details.powerLevel", { value: details.powerLevel ?? 0 })}
      </span>
      <span className="flex items-center gap-1">
        {t("hse.details.tier", {
          tier: t(`hse.details.tiers.${details.tier.tier}`),
        })}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              aria-label={rules}
              className="inline-flex border-0 bg-transparent p-0 text-muted-foreground"
              data-testid="hse-event-details-tier-rules"
              type="button"
            >
              <Info aria-hidden="true" className="size-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <ul className="space-y-0.5">
              {(["low", "mid", "high"] as const).map((rule) => (
                <li key={rule}>
                  {t(`hse.details.tierRules.${rule}`, { threshold: PL_MEDIUM })}
                </li>
              ))}
            </ul>
          </TooltipContent>
        </Tooltip>
      </span>
    </div>
  )
}

function Description({ details }: { details: HseDetailsView }) {
  const { t } = useTranslation("dailies")
  const render = useHseText()
  const isMobile = useIsMobile()
  const [expanded, setExpanded] = useState(false)
  const lines = details.description.map(render)
  if (lines.length === 0) return null
  const collapsible = isMobile && lines.length > 1
  const shown = collapsible && !expanded ? lines.slice(0, 1) : lines
  const item = (line: string, index: number): ReactNode => (
    <li key={index}>{t("hse.details.descriptionLine", { line })}</li>
  )
  return (
    <div className="space-y-1">
      <ul
        className="list-disc space-y-1 pl-5 text-sm"
        data-testid="hse-event-details-description"
      >
        {shown.map(item)}
      </ul>
      {collapsible ? (
        <Button
          aria-expanded={expanded}
          className="h-auto px-0"
          data-testid="hse-event-details-show-more"
          onClick={() => setExpanded((value) => !value)}
          size="sm"
          variant="link"
        >
          {expanded ? t("hse.details.showLess") : t("hse.details.showMore")}
        </Button>
      ) : null}
    </div>
  )
}

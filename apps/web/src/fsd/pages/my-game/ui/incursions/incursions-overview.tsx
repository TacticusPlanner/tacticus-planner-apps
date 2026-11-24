import { Link } from "react-router"
import { useTranslation } from "react-i18next"
import { ChevronRight } from "lucide-react"
import { countdownIcon, mowIcon } from "@workspace/game-catalog"
import type { UnitId } from "@workspace/game-domain"
import { Badge } from "@workspace/ui/components/badge"

import { useIncursionWindow } from "@/entities/incursion"
import { useMinuteNow } from "@/entities/legendary-event"
import { formatEventCountdown } from "@/shared/lib"
import { EmptyState, EntityIcon, HowToRead } from "@/shared/ui"

import { useIncursionsOverviewTutorial } from "./incursions-overview.tutorial"

import { incursionStarCount } from "../../model/incursion-progress.model"
import { IncursionStarsBar } from "./incursion-stars-bar"
import { IncursionTierStrip } from "./incursion-tier-strip"
import { incursionPath, useIncursionsOutlet } from "./incursions-outlet"

const SECONDS_PER_HOUR = 3600

/** The Incursion landing page: the event's rules, then a card per Machine of War, newest first. */
export function IncursionsOverview() {
  const { t, i18n } = useTranslation(["incursions", "mows"])
  const { incursions, ownedMowIds, progress } = useIncursionsOutlet()
  const nowMs = useMinuteNow()
  const run = useIncursionWindow(nowMs)
  const rules = incursions[0]
  useIncursionsOverviewTutorial()

  if (!rules) {
    return <EmptyState description={t("empty")} testId="incursions-empty" />
  }

  return (
    <div className="flex flex-col gap-6">
      {run ? (
        <p
          className="flex items-center gap-1.5 text-sm font-medium tabular-nums"
          data-testid="incursions-countdown"
          data-status={run.status}
        >
          <EntityIcon size="inline" alt="" src={countdownIcon()} />
          {t(run.status === "live" ? "event.endsIn" : "event.startsIn", {
            when: formatEventCountdown(
              run.status === "live" ? run.endMs : run.startMs,
              nowMs,
              i18n.language,
              { withHours: true }
            ),
          })}
        </p>
      ) : null}
      <HowToRead data-testid="incursions-rules" summary={t("rules.title")}>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            {t("rules.tokens", {
              start: rules.tokens.start,
              max: rules.tokens.max,
              hours: Math.round(
                rules.tokens.regenSeconds /
                  rules.tokens.regenAmount /
                  SECONDS_PER_HOUR
              ),
              cost: rules.tokens.costPerRun,
            })}
          </li>
          <li>
            {t("rules.team", {
              count: rules.minUnitsOfGrandAllianceNeeded,
            })}
          </li>
          <li>{t("rules.progress")}</li>
          <li>{t("rules.replay")}</li>
        </ul>
      </HowToRead>

      <ul
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
        data-testid="incursions-list"
      >
        {incursions.map((incursion) => {
          const testId = `incursion-${incursion.mowId}`
          const owned = ownedMowIds.has(incursion.mowId)
          const name = t(`mows:${incursion.mowId}`, {
            defaultValue: incursion.mowId,
          })
          const stars = progress?.starsOf(incursion.mowId)
          const total = stars ? incursionStarCount(incursion, stars) : undefined
          return (
            <li key={incursion.mowId} data-testid={testId}>
              <Link
                to={incursionPath(incursion.mowId)}
                className="flex h-full items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                data-testid={`${testId}-open`}
              >
                <EntityIcon
                  size="portrait-md"
                  src={mowIcon(incursion.mowId as UnitId)}
                  alt=""
                  className="shrink-0 rounded-sm"
                />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <p className="truncate font-semibold">{name}</p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {incursion.new ? <Badge>{t("card.new")}</Badge> : null}
                    {incursion.updated ? (
                      <Badge variant="secondary">{t("card.revamped")}</Badge>
                    ) : null}
                    <Badge
                      variant="outline"
                      className={owned ? undefined : "text-muted-foreground"}
                      data-testid={`${testId}-owned`}
                    >
                      {owned ? t("card.owned") : t("card.notOwned")}
                    </Badge>
                  </div>
                  {stars ? (
                    <IncursionTierStrip
                      incursion={incursion}
                      stars={stars}
                      data-testid={`${testId}-cleared`}
                    />
                  ) : null}
                  {total ? (
                    <IncursionStarsBar
                      earned={total.earned}
                      max={total.max}
                      data-testid={`${testId}-stars`}
                    />
                  ) : null}
                </div>
                <ChevronRight
                  className="size-icon shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

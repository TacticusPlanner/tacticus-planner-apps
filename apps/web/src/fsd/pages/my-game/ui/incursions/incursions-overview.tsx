import { Link } from "react-router"
import { useTranslation } from "react-i18next"
import { ChevronRight } from "lucide-react"
import {
  countdownIcon,
  incursionTokenIcon,
  mowIcon,
} from "@workspace/game-catalog"
import type { UnitId } from "@workspace/game-domain"
import { Badge } from "@workspace/ui/components/badge"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion"

import { useIncursionWindow } from "@/entities/incursion"
import { useMinuteNow } from "@/entities/legendary-event"
import { formatEventCountdown } from "@/shared/lib"
import { EntityIcon } from "@/shared/ui"

import {
  clearedTierCount,
  incursionStarCount,
} from "../../model/incursion-progress.model"
import { IncursionStarsBar } from "./incursion-stars-bar"
import { incursionPath, useIncursionsOutlet } from "./incursions-outlet"

const SECONDS_PER_HOUR = 3600

/** The Incursion landing page: the event's rules, then a card per Machine of War, newest first. */
export function IncursionsOverview() {
  const { t, i18n } = useTranslation(["incursions", "mows"])
  const { incursions, ownedMowIds, progress } = useIncursionsOutlet()
  const nowMs = useMinuteNow()
  const run = useIncursionWindow(nowMs)
  const rules = incursions[0]

  if (!rules) {
    return (
      <p className="text-muted-foreground" data-testid="incursions-empty">
        {t("empty")}
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {run ? (
        <p
          className="flex items-center gap-1.5 text-sm font-medium tabular-nums"
          data-testid="incursions-countdown"
          data-status={run.status}
        >
          <EntityIcon alt="" className="size-5" src={countdownIcon()} />
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
      <Accordion
        type="single"
        collapsible
        className="rounded-lg border bg-card px-4"
        data-testid="incursions-rules"
      >
        <AccordionItem value="rules" className="border-b-0">
          <AccordionTrigger
            className="items-center hover:no-underline"
            data-testid="incursions-rules-toggle"
          >
            <span className="flex items-center gap-2 font-semibold">
              <EntityIcon
                src={incursionTokenIcon()}
                alt=""
                className="size-6"
              />
              {t("rules.title")}
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
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
          </AccordionContent>
        </AccordionItem>
      </Accordion>

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
                  src={mowIcon(incursion.mowId as UnitId)}
                  alt=""
                  className="size-14 shrink-0 rounded"
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
                    {stars ? (
                      <Badge
                        variant="outline"
                        className="tabular-nums"
                        data-testid={`${testId}-cleared`}
                      >
                        {t("progress.badge", {
                          cleared: clearedTierCount(incursion, stars),
                          total: incursion.tiers.length,
                        })}
                      </Badge>
                    ) : null}
                  </div>
                  {total ? (
                    <IncursionStarsBar
                      earned={total.earned}
                      max={total.max}
                      data-testid={`${testId}-stars`}
                    />
                  ) : null}
                </div>
                <ChevronRight
                  className="size-5 shrink-0 text-muted-foreground"
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

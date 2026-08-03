import { useState } from "react"
import { useOutletContext } from "react-router"
import { BatteryLow, CalendarClock, CalendarDays, Swords } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import { useDailyRaids } from "../model/use-daily-raids"
import { energyIconUrl, EntityIcon } from "@/shared/ui"
import type { DailiesOutletContext } from "./dailies-layout"
import { RaidSchedule } from "./raid-schedule"
import { RaidState } from "./raid-state"
import { useRaidsPlanTutorial } from "./raids-plan.tutorial"

const DAY_LIMIT = 3

export function RaidsPlanPage() {
  const context = useOutletContext<DailiesOutletContext>()
  const { t } = useTranslation("dailies")
  const [showAllDays, setShowAllDays] = useState(false)
  const [compact, setCompact] = useState(false)
  const raids = useDailyRaids(context.projectId)
  useRaidsPlanTutorial()

  if (context.projectsUnavailable) return <RaidState state="no-project" />
  if (raids.status !== "ready") return <RaidState state={raids.status} />

  const visibleDays = showAllDays
    ? raids.planDays
    : raids.planDays.slice(0, DAY_LIMIT)

  return (
    <div className="space-y-5" data-testid="raids-plan-page">
      <section
        className="grid grid-cols-2 overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-foreground/5 md:grid-cols-5 dark:ring-foreground/10"
        data-testid="plan-summary"
      >
        {(
          [
            [
              "plan.summary.days",
              raids.planSummary.totalDays,
              <CalendarDays key="days" />,
            ],
            [
              "plan.summary.energy",
              raids.planSummary.totalEnergy,
              <EntityIcon
                key="energy"
                alt=""
                className="size-5"
                src={energyIconUrl}
              />,
            ],
            [
              "plan.summary.raids",
              raids.planSummary.totalRaids,
              <Swords key="raids" />,
            ],
            [
              "plan.summary.unusedDays",
              raids.planSummary.daysWithUnusedEnergy,
              <BatteryLow key="unused" />,
            ],
            [
              "plan.summary.completion",
              raids.planSummary.completionDate,
              <CalendarClock key="completion" />,
            ],
          ] as const
        ).map(([key, value, icon]) => (
          <div
            key={key}
            className="flex min-w-0 items-center gap-2 border-r border-b p-3 last:col-span-2 md:border-b-0 md:last:col-span-1 md:last:border-r-0"
          >
            <span
              aria-hidden="true"
              className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground [&>svg]:size-4"
            >
              {icon}
            </span>
            <div className="min-w-0">
              <div className="truncate text-xs text-muted-foreground">
                {t(key)}
              </div>
              <div className="truncate text-base font-semibold tabular-nums md:text-lg">
                {value}
              </div>
            </div>
          </div>
        ))}
      </section>
      <div className="flex justify-end">
        <Button variant="outline" onClick={() => setCompact((value) => !value)}>
          {t(compact ? "plan.expand" : "plan.collapse")}
        </Button>
      </div>
      <div
        className="grid gap-3 md:[grid-template-columns:repeat(auto-fit,minmax(20rem,1fr))] md:gap-4"
        data-testid="plan-days"
      >
        {visibleDays.map((day) => (
          <Card
            key={day.day}
            className="gap-3 py-3 md:gap-4 md:py-4"
            data-testid={`plan-day-${day.day}`}
            size="sm"
          >
            <CardHeader className="gap-2 px-3 md:px-4">
              <div className="flex items-center justify-between gap-2">
                <CardTitle>
                  {day.day === 1
                    ? t("raids.tabs.today")
                    : t("plan.day", { day: day.day })}
                </CardTitle>
                <div aria-hidden="true" className="flex gap-2">
                  <span className="flex items-center gap-1 text-xs tabular-nums">
                    <EntityIcon alt="" className="size-4" src={energyIconUrl} />
                    {day.energyTotal}/{raids.dailyEnergy}
                  </span>
                  <span className="flex items-center gap-1 text-xs tabular-nums">
                    <Swords className="size-3.5 text-muted-foreground" />
                    {day.raidsTotal}
                  </span>
                </div>
              </div>
              <p className="sr-only">
                {t("plan.dayStats", {
                  energy: day.energyTotal,
                  available: raids.dailyEnergy,
                  raids: day.raidsTotal,
                })}
              </p>
            </CardHeader>
            <CardContent className="px-3 md:px-4">
              <RaidSchedule
                entries={day.entries}
                attemptsUsedByBattle={day.attemptsUsedByBattle}
                goalsById={raids.goalsById}
                locationsByBattleId={raids.locationsByBattleId}
                resourceLabels={raids.resourceLabels}
                resourceProgress={
                  raids.resourceProgressByDay.get(day.day) ?? new Map()
                }
                resourceVisuals={raids.resourceVisuals}
                compact={compact}
                layout="column"
                testId={`plan-day-${day.day}-raids`}
              />
            </CardContent>
          </Card>
        ))}
      </div>
      {!showAllDays && raids.planDays.length > DAY_LIMIT ? (
        <Button variant="outline" onClick={() => setShowAllDays(true)}>
          {t("plan.showAll")}
        </Button>
      ) : null}
    </div>
  )
}

import { useMemo, useState } from "react"
import { BatteryLow, CalendarClock, CalendarDays, Swords } from "lucide-react"
import { useOutletContext } from "react-router"
import { useTranslation } from "react-i18next"

import {
  useDailyRaids,
  type DailyRaidsReadyViewModel,
} from "@/features/daily-raids"
import { energyIconUrl, EntityIcon } from "@/shared/ui"
import { buildPlanDayCells, buildPlanUnitRanges } from "../model/plan-day-cells"
import type { DailiesOutletContext } from "./dailies-layout"
import { PlanBlockers } from "./plan-blockers"
import { PLAN_DAY_LIMIT, PlanDayStrip } from "./plan/plan-day-strip"
import { PlanUnitFilter } from "./plan/plan-unit-filter"
import { RaidState } from "./raid-state"
import { useRaidsPlanTutorial } from "./raids-plan.tutorial"

export function RaidsPlanPage() {
  const context = useOutletContext<DailiesOutletContext>()
  const raids = useDailyRaids(context.projectId)
  useRaidsPlanTutorial()

  if (raids.status !== "ready") return <RaidState state={raids.status} />
  return <RaidsPlan raids={raids} />
}

function RaidsPlan({ raids }: { raids: DailyRaidsReadyViewModel }) {
  const { t } = useTranslation("dailies")
  const [selectedUnitId, setSelectedUnitId] = useState<string>()
  const [showAllDays, setShowAllDays] = useState(false)
  const [jumpTo, setJumpTo] = useState<{ day: number }>()
  const cellsByDay = useMemo(
    () => raids.planDays.map((day) => buildPlanDayCells(day, raids)),
    [raids]
  )
  const unitRanges = useMemo(
    () => buildPlanUnitRanges(cellsByDay),
    [cellsByDay]
  )

  return (
    <div className="space-y-5" data-testid="raids-plan-page">
      <section data-testid="plan-summary">
        <div
          className="grid grid-cols-2 overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-foreground/5 md:grid-cols-5 dark:ring-foreground/10"
          data-testid="plan-summary-stats"
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
                raids.planSummary.completionDate ??
                  t("plan.summary.noCompletion"),
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
        </div>
      </section>
      <PlanBlockers raids={raids} />
      <PlanUnitFilter
        onJump={(day) => {
          if (day > PLAN_DAY_LIMIT) setShowAllDays(true)
          setJumpTo({ day })
        }}
        onSelect={(unitId) => {
          setSelectedUnitId(unitId)
          if (!unitId) return
          // Filtering is only useful across the whole plan: reveal every day and go to the
          // unit's first one.
          setShowAllDays(true)
          const firstDay = unitRanges.find(
            ({ unit }) => unit.unitId === unitId
          )?.firstDay
          if (firstDay) setJumpTo({ day: firstDay })
        }}
        ranges={unitRanges}
        selectedUnitId={selectedUnitId}
      />
      <PlanDayStrip
        cellsByDay={cellsByDay}
        jumpTo={jumpTo}
        onShowAll={() => setShowAllDays(true)}
        raids={raids}
        selectedUnitId={selectedUnitId}
        showAllDays={showAllDays}
      />
    </div>
  )
}

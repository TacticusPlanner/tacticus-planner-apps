import { useMemo, useState } from "react"
import { BatteryLow, CalendarClock, CalendarDays, Swords } from "lucide-react"
import { useTranslation } from "react-i18next"

import {
  buildPlanDayCells,
  buildPlanUnitRanges,
  PLAN_DAY_LIMIT,
  PlanBlockers,
  PlanDayStrip,
  PlanUnitFilter,
  RaidState,
  useDailyRaids,
  type DailyRaidsReadyViewModel,
} from "@/features/daily-raids"
import {
  PlanningSettingsDialog,
  PlanningSettingsTrigger,
} from "@/entities/planning-setting"
import { ProjectSelect, useProjects } from "@/entities/project"
import { energyIconUrl, EntityIcon } from "@/shared/ui"
import { useScheduleTutorial } from "./schedule-page.tutorial"

/**
 * Plan > Schedule: the day-by-day continuation of Today's raid plan (formerly Dailies > Raids >
 * Raids Plan). Like Insights it owns a session-local project selection (default: all goals) rather
 * than sharing Dailies' outlet-context one, and it carries its own Planning Settings trigger since
 * every total here depends on daily energy. The dailies namespace is kept for its copy - it is
 * preloaded app-wide (see nav-items.ts) and the keys did not change meaning by moving sections.
 */
export function SchedulePage() {
  const { t } = useTranslation("dailies")
  const projects = useProjects()
  const [projectId, setProjectId] = useState<string>()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const raids = useDailyRaids(projectId)
  useScheduleTutorial()

  return (
    <div className="space-y-5" data-testid="schedule-page">
      {/* goals-navigation spec: a subpage with a project selector but no tab/status row renders it
          right-aligned alone; the Planning Settings trigger trails it (planning-settings-access). */}
      <div className="flex items-center justify-end gap-2">
        <ProjectSelect
          allowAll
          onProjectIdChange={setProjectId}
          placeholder={t("project.placeholder")}
          projectId={projectId}
          projects={projects.projects}
          testId="schedule-project-select"
        />
        <PlanningSettingsTrigger
          onClick={() => setSettingsOpen(true)}
          testId="schedule-planning-settings"
        />
      </div>
      {raids.status === "ready" ? (
        <SchedulePlan raids={raids} />
      ) : (
        <RaidState state={raids.status} />
      )}
      {settingsOpen ? (
        <PlanningSettingsDialog
          onOpenChange={setSettingsOpen}
          open={settingsOpen}
        />
      ) : null}
    </div>
  )
}

function SchedulePlan({ raids }: { raids: DailyRaidsReadyViewModel }) {
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

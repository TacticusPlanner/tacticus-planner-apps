import { useState, type ReactNode } from "react"
import { Swords } from "lucide-react"
import { onslaughtTokenIcon } from "@workspace/game-catalog"
import { useOutletContext } from "react-router"
import { useTranslation } from "react-i18next"
import type { BattleId } from "@workspace/game-domain"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Progress } from "@workspace/ui/components/progress"

import {
  buildOnslaughtRuns,
  FilteredOutNotice,
  OnslaughtRunList,
  RaidsFiltersTrigger,
  useDailyRaids,
  RaidSchedule,
  RaidState,
  ResourceIconWithTooltip,
  selectTodayRaids,
  type DailyRaidBattleResource,
  type DailyRaidLocationViewModel,
  type DailyRaidsReadyViewModel,
  type TodaysAttempt,
} from "@/features/daily-raids"
import {
  PlanningSettingsDialog,
  PlanningSettingsTrigger,
} from "@/entities/planning-setting"
import { ProjectSelect } from "@/entities/project"
import { energyIconUrl, EntityIcon } from "@/shared/ui"
import { CampaignEventStatusLine } from "./campaign-event-status"
import type { DailiesOutletContext } from "./dailies-layout"
import { TodayShops } from "./today-shops"
import { useTodayTutorial } from "./today.tutorial"

const BONUS_LIMIT = 3

/**
 * Dailies > Raids is the Today page itself (the multi-day plan is Plan > Schedule). Above the
 * schedule sits the Dailies-wide project selector (default: all goals) with the shared Planning
 * Settings trigger trailing it (`planning-settings-access`) - the same dialog Plan > Goals opens - and
 * the Raids Filters trigger before it (filters constrain Today and Bonus Raids only). Today's shop
 * buys for the same project close the page (the former Shops tab).
 */
export function TodayPage() {
  const context = useOutletContext<DailiesOutletContext>()
  const { t } = useTranslation("dailies")
  const [settingsOpen, setSettingsOpen] = useState(false)
  const raids = useDailyRaids(context.projectId)
  useTodayTutorial()

  return (
    <section className="space-y-5" data-testid="dailies-raids-layout">
      <div className="flex items-center justify-end gap-2">
        <ProjectSelect
          allowAll
          onProjectIdChange={context.setProjectId}
          placeholder={t("project.placeholder")}
          projectId={context.projectId}
          projects={context.projects}
          testId="raids-project-select"
        />
        <RaidsFiltersTrigger />
        <PlanningSettingsTrigger
          onClick={() => setSettingsOpen(true)}
          testId="raids-planning-settings"
        />
      </div>
      {raids.status === "ready" ? (
        <TodaySchedule raids={raids} />
      ) : (
        <RaidState state={raids.status} />
      )}
      <TodayShops />
      {settingsOpen ? (
        <PlanningSettingsDialog
          onOpenChange={setSettingsOpen}
          open={settingsOpen}
        />
      ) : null}
    </section>
  )
}

function TodaySchedule({ raids }: { raids: DailyRaidsReadyViewModel }) {
  const { t } = useTranslation("dailies")
  const [showAllBonus, setShowAllBonus] = useState(false)

  // Exhausted bonus locations are dropped before slicing to BONUS_LIMIT — otherwise an actionable
  // entry past the limit can become unreachable if the first few entries all happen to be exhausted.
  // Once today's real energy spend reaches the daily limit, the plan lane is dropped and Bonus
  // Raids is the only raids list.
  const selection = selectTodayRaids({
    todayEntries: raids.today.entries,
    bonusEntries: raids.bonus.entries,
    raidsLeftTodayEntries: raids.raidsLeftToday.entries,
    attemptsLeftByBattle: raids.attemptsLeftByBattle,
    dailyEnergy: raids.dailyEnergy,
    realEnergyUsedToday: raids.realEnergyUsedToday,
  })
  const planEntries = selection.planEntries
  const bonusEntries = showAllBonus
    ? selection.bonusEntries
    : selection.bonusEntries.slice(0, BONUS_LIMIT)
  // Passed as one combined map alongside the combined entries below — only Raids Plan's own
  // (unaffected) material-emphasis rendering ever reads this for its per-node fully-raided chip;
  // the "location" emphasis path used here relies on `attemptsLeftByBattle` instead.
  const combinedAttemptsUsedByBattle = new Map(raids.today.attemptsUsedByBattle)
  for (const [battleId, used] of raids.bonus.attemptsUsedByBattle) {
    combinedAttemptsUsedByBattle.set(
      battleId,
      (combinedAttemptsUsedByBattle.get(battleId) ?? 0) + used
    )
  }
  const todayProgress = raids.resourceProgressByDay.get(1) ?? new Map()
  // Today's Attempts is account-wide, so most locations there sit outside this project's plan. Where
  // this project's schedule/Bonus Raids do name a node, that entry wins — the resource the player is
  // actually farming beats the node's generic drop — and the first plan entry per node wins, as
  // before. Every other node falls back to the catalog's own node → drop index so it still gets an
  // icon (tacticus-planner-apps#121); the fallback is read per row rather than merged in here, so
  // the catalog-wide index is never copied on a render.
  const planResourceByBattle = new Map<BattleId, DailyRaidBattleResource>()
  for (const entry of [...raids.today.entries, ...raids.bonus.entries]) {
    if (planResourceByBattle.has(entry.battleId)) continue
    const visual = raids.resourceVisuals.get(entry.resourceId)
    if (!visual) continue
    planResourceByBattle.set(entry.battleId, {
      label: raids.resourceLabels.get(entry.resourceId) ?? entry.resourceId,
      visual,
    })
  }
  // Today's share of the account's Onslaught tokens, already split across goals in priority order by
  // the same run the Schedule's day cards read. The badge rounds up: a token is spent whole.
  const onslaughtRuns = buildOnslaughtRuns(raids.today, raids)
  const onslaughtRunsTotal = onslaughtRuns.reduce(
    (sum, run) => sum + run.runs,
    0
  )
  const energyUsagePercent =
    raids.dailyEnergy > 0
      ? (raids.realEnergyUsedToday / raids.dailyEnergy) * 100
      : 0

  const scheduleProps = {
    attemptsLeftByBattle: raids.attemptsLeftByBattle,
    attemptsUsedByBattle: combinedAttemptsUsedByBattle,
    emphasis: "location" as const,
    goalsById: raids.goalsById,
    locationsByBattleId: raids.locationsByBattleId,
    resourceLabels: raids.resourceLabels,
    resourceProgress: todayProgress,
    resourceUrgencyByGoalAndResource: raids.resourceUrgencyByGoalAndResource,
    resourceVisuals: raids.resourceVisuals,
  }

  return (
    <div className="space-y-5 md:space-y-7" data-testid="today-page">
      <section className="space-y-3" data-testid="today-schedule">
        {/* Two equal halves on desktop: the schedule's own header and energy budget on the left,
            the detected campaign event on the right. They stack on mobile. */}
        <div className="space-y-4 md:flex md:items-start md:gap-6 md:space-y-0">
          <div className="space-y-2 md:w-1/2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">{t("today.title")}</h2>
              <p className="sr-only">
                {t("today.summary", {
                  energy: raids.today.energyTotal,
                  raids: raids.today.raidsTotal,
                })}
              </p>
              <div aria-hidden="true" className="flex flex-wrap gap-2">
                <BadgeStat
                  icon={
                    <EntityIcon alt="" className="size-4" src={energyIconUrl} />
                  }
                  value={raids.today.energyTotal}
                />
                <BadgeStat
                  icon={<Swords className="size-4 text-muted-foreground" />}
                  value={raids.today.raidsTotal}
                />
              </div>
            </div>
            <div className="flex items-center gap-2" data-testid="energy-usage">
              <Progress
                aria-label={t("today.energyUsage.label")}
                aria-valuetext={t("today.energyUsage.value", {
                  percent: Math.round(energyUsagePercent),
                })}
                className="h-2 flex-1"
                data-testid="energy-usage-bar"
                value={Math.min(energyUsagePercent, 100)}
              />
              <span
                aria-hidden="true"
                className="shrink-0 text-xs font-medium text-muted-foreground tabular-nums"
              >
                {Math.round(energyUsagePercent)}%
              </span>
            </div>
          </div>
          <CampaignEventStatusLine className="space-y-2 md:w-1/2" />
        </div>
        <FilteredOutNotice filteredOut={raids.filteredOut} />
      </section>
      {/* Three lanes (Today / Bonus Raids / Today's attempts) auto-fit side by side wherever the
          viewport has room for 20rem each, and stack otherwise - no dedicated breakpoint. Once the
          daily energy limit is spent, the Today lane is dropped and Bonus Raids is the only list. */}
      <div
        className="space-y-5 md:grid md:grid-cols-[repeat(auto-fit,minmax(20rem,1fr))] md:items-start md:gap-6 md:space-y-0"
        data-testid="today-lanes"
      >
        {selection.energyLimitReached ||
        planEntries.length > 0 ||
        bonusEntries.length > 0 ? (
          <>
            {planEntries.length > 0 ? (
              <section className="space-y-2" data-testid="today-lane">
                <h2 className="text-lg font-semibold">{t("today.plan")}</h2>
                <RaidSchedule
                  {...scheduleProps}
                  entries={planEntries}
                  testId="today-raid-list"
                />
              </section>
            ) : null}
            {selection.energyLimitReached || bonusEntries.length > 0 ? (
              <section className="space-y-2" data-testid="bonus-lane">
                <h2
                  className="text-lg font-semibold"
                  data-testid="bonus-raids-heading"
                >
                  {t("bonus.title")}
                </h2>
                {selection.energyLimitReached ? (
                  <p
                    className="text-sm text-muted-foreground"
                    data-testid="bonus-energy-limit-reached"
                  >
                    {t(
                      bonusEntries.length > 0
                        ? "bonus.limitReached"
                        : "bonus.limitReachedEmpty"
                    )}
                  </p>
                ) : null}
                {bonusEntries.length > 0 ? (
                  <RaidSchedule
                    {...scheduleProps}
                    entries={bonusEntries}
                    testId="bonus-raid-list"
                  />
                ) : null}
                {!showAllBonus &&
                selection.bonusEntries.length > BONUS_LIMIT ? (
                  <Button
                    className="mt-2"
                    variant="outline"
                    onClick={() => setShowAllBonus(true)}
                  >
                    {t("bonus.showMore")}
                  </Button>
                ) : null}
              </section>
            ) : null}
          </>
        ) : (
          <RaidState state="no-farmable" />
        )}
        <section className="space-y-3" data-testid="todays-attempts">
          <h2 className="text-lg font-semibold">{t("todaysAttempts.title")}</h2>
          {raids.todaysAttempts.length > 0 ? (
            <TodaysAttemptsList
              attempts={raids.todaysAttempts}
              locationsByBattleId={raids.locationsByBattleId}
              planResourceByBattle={planResourceByBattle}
              catalogResourceByBattle={raids.resourceByBattleId}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("todaysAttempts.empty")}
            </p>
          )}
        </section>
      </div>
      {onslaughtRuns.length > 0 ? (
        <section className="space-y-2" data-testid="today-onslaught">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">{t("plan.onslaught")}</h2>
            <p className="sr-only">
              {t("today.onslaughtSummary", {
                runs: Math.ceil(onslaughtRunsTotal),
              })}
            </p>
            <div aria-hidden="true">
              <BadgeStat
                icon={
                  <EntityIcon
                    alt=""
                    className="size-4"
                    src={onslaughtTokenIcon()}
                  />
                }
                value={Math.ceil(onslaughtRunsTotal)}
              />
            </div>
          </div>
          <OnslaughtRunList
            rowTestId={(unitId) => `today-onslaught-${unitId}`}
            runs={onslaughtRuns}
            testId="today-onslaught-list"
          />
        </section>
      ) : null}
    </div>
  )
}

export function TodaysAttemptsList({
  attempts,
  locationsByBattleId,
  planResourceByBattle,
  catalogResourceByBattle,
}: {
  attempts: TodaysAttempt[]
  locationsByBattleId: ReadonlyMap<BattleId, DailyRaidLocationViewModel>
  planResourceByBattle: ReadonlyMap<BattleId, DailyRaidBattleResource>
  catalogResourceByBattle: ReadonlyMap<BattleId, DailyRaidBattleResource>
}) {
  const { t } = useTranslation("dailies")

  return (
    <div className="grid gap-2 md:gap-3" data-testid="todays-attempts-list">
      {attempts.map(({ battleId, attemptsUsed }) => {
        const location = locationsByBattleId.get(battleId)
        const resource =
          planResourceByBattle.get(battleId) ??
          catalogResourceByBattle.get(battleId)
        return (
          <div
            key={battleId}
            className="flex items-center gap-2 rounded-lg border px-3 py-2"
            data-testid={`todays-attempt-${battleId}`}
          >
            {resource ? (
              <ResourceIconWithTooltip
                className="size-10 md:size-12"
                label={resource.label}
                visual={resource.visual}
              />
            ) : (
              // A node the catalog has no drop for at all (e.g. a dataset gap) still keeps its
              // leading slot, so the campaign icon and text stay aligned down the whole list.
              <span aria-hidden className="size-10 shrink-0 md:size-12" />
            )}
            {location?.icon ? (
              <EntityIcon
                alt=""
                className="size-6 shrink-0"
                src={location.icon}
              />
            ) : null}
            <div className="min-w-0 flex-1 leading-tight">
              <div className="text-sm font-medium break-words">
                {location?.campaignName ?? battleId}
              </div>
              {location?.nodeLabel ? (
                <div className="text-xs break-words text-muted-foreground">
                  {location.nodeLabel}
                </div>
              ) : null}
            </div>
            <Badge className="shrink-0" variant="outline">
              {t("schedule.raids", { count: attemptsUsed })}
            </Badge>
          </div>
        )
      })}
    </div>
  )
}

function BadgeStat({ icon, value }: { icon: ReactNode; value: number }) {
  return (
    <span className="flex h-7 items-center gap-1.5 rounded-full bg-muted px-2.5 text-sm font-medium tabular-nums">
      {icon}
      {value}
    </span>
  )
}

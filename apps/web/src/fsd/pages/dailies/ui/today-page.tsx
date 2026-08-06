import { useState, type ReactNode } from "react"
import { useOutletContext } from "react-router"
import { Swords } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { BattleId } from "@workspace/game-domain"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Progress } from "@workspace/ui/components/progress"
import { Separator } from "@workspace/ui/components/separator"

import type { TodaysAttempt } from "../model/daily-raids-energy"
import { useDailyRaids } from "../model/use-daily-raids"
import type {
  DailyRaidLocationViewModel,
  DailyRaidResourceVisual,
} from "../model/daily-raids.domain"
import { energyIconUrl, EntityIcon } from "@/shared/ui"
import type { DailiesOutletContext } from "./dailies-layout"
import { RaidSchedule } from "./raid-schedule"
import { RaidState } from "./raid-state"
import { ResourceIconWithTooltip } from "./resource-card"
import { useTodayTutorial } from "./today.tutorial"

const BONUS_LIMIT = 3

export function TodayPage() {
  const context = useOutletContext<DailiesOutletContext>()
  const { t } = useTranslation("dailies")
  const [showAllBonus, setShowAllBonus] = useState(false)
  const raids = useDailyRaids(context.projectId)
  useTodayTutorial()

  if (context.projectsError) {
    return <RaidState state="error" onRetry={context.retryProjects} />
  }
  if (context.projectsUnavailable) return <RaidState state="no-project" />
  if (raids.status !== "ready") return <RaidState state={raids.status} />

  // Filter out exhausted locations before slicing to BONUS_LIMIT — otherwise an actionable entry
  // past the limit can become unreachable if the first few entries all happen to be exhausted.
  const visibleBonusEntries = raids.bonus.entries.filter(
    (entry) => raids.attemptsLeftByBattle.get(entry.battleId) !== 0
  )
  const bonusEntries = showAllBonus
    ? visibleBonusEntries
    : visibleBonusEntries.slice(0, BONUS_LIMIT)
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
  // Today's Attempts is account-wide, so most locations there have no associated resource at all
  // (they're outside this project's plan) — this only resolves one for locations this project's
  // schedule/Bonus Raids happen to also reference, picking the first resource encountered per node.
  const resourceByBattle = new Map<
    BattleId,
    { label: string; visual: DailyRaidResourceVisual | undefined }
  >()
  for (const entry of [...raids.today.entries, ...raids.bonus.entries]) {
    if (resourceByBattle.has(entry.battleId)) continue
    resourceByBattle.set(entry.battleId, {
      label: raids.resourceLabels.get(entry.resourceId) ?? entry.resourceId,
      visual: raids.resourceVisuals.get(entry.resourceId),
    })
  }
  const energyUsagePercent =
    raids.dailyEnergy > 0
      ? (raids.realEnergyUsedToday / raids.dailyEnergy) * 100
      : 0

  return (
    <div className="space-y-5 md:space-y-7" data-testid="today-page">
      <section className="space-y-3" data-testid="today-schedule">
        <div className="space-y-2">
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
        {raids.today.entries.length > 0 || bonusEntries.length > 0 ? (
          <RaidSchedule
            entries={raids.today.entries}
            bonusEntries={bonusEntries}
            bonusFooter={
              !showAllBonus && visibleBonusEntries.length > BONUS_LIMIT ? (
                <Button
                  className="mt-2"
                  variant="outline"
                  onClick={() => setShowAllBonus(true)}
                >
                  {t("bonus.showMore")}
                </Button>
              ) : null
            }
            bonusLabel={t("bonus.title")}
            attemptsLeftByBattle={raids.attemptsLeftByBattle}
            attemptsUsedByBattle={combinedAttemptsUsedByBattle}
            emphasis="location"
            goalsById={raids.goalsById}
            locationsByBattleId={raids.locationsByBattleId}
            resourceLabels={raids.resourceLabels}
            resourceProgress={todayProgress}
            resourceVisuals={raids.resourceVisuals}
            testId="today-raid-list"
          />
        ) : (
          <RaidState state="no-farmable" />
        )}
      </section>
      <Separator />
      <section className="space-y-3" data-testid="todays-attempts">
        <h2 className="text-lg font-semibold">{t("todaysAttempts.title")}</h2>
        {raids.todaysAttempts.length > 0 ? (
          <TodaysAttemptsList
            attempts={raids.todaysAttempts}
            locationsByBattleId={raids.locationsByBattleId}
            resourceByBattle={resourceByBattle}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            {t("todaysAttempts.empty")}
          </p>
        )}
      </section>
    </div>
  )
}

function TodaysAttemptsList({
  attempts,
  locationsByBattleId,
  resourceByBattle,
}: {
  attempts: TodaysAttempt[]
  locationsByBattleId: ReadonlyMap<BattleId, DailyRaidLocationViewModel>
  resourceByBattle: ReadonlyMap<
    BattleId,
    { label: string; visual: DailyRaidResourceVisual | undefined }
  >
}) {
  const { t } = useTranslation("dailies")

  return (
    <div className="grid gap-2 md:gap-3" data-testid="todays-attempts-list">
      {attempts.map(({ battleId, attemptsUsed, attemptsLeft }) => {
        const location = locationsByBattleId.get(battleId)
        const resource = resourceByBattle.get(battleId)
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
            ) : null}
            {location?.icon ? (
              <EntityIcon
                alt=""
                className="size-6 shrink-0"
                src={location.icon}
              />
            ) : null}
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate text-sm font-medium">
                {location?.fullName ?? battleId}
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {t("schedule.battle", {
                  number: location?.nodeNumber ?? battleId,
                })}
              </div>
            </div>
            <Badge
              className="shrink-0"
              variant={attemptsLeft === 0 ? "secondary" : "outline"}
            >
              {attemptsLeft === 0
                ? t("schedule.maxRaids")
                : t("schedule.raids", { count: attemptsUsed })}
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

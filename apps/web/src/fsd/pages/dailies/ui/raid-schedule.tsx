import { useTranslation } from "react-i18next"
import { characterIcon, mowIcon } from "@workspace/game-catalog"
import type { BattleId } from "@workspace/game-domain"
import { Badge } from "@workspace/ui/components/badge"
import { Card, CardContent } from "@workspace/ui/components/card"
import { cn } from "@workspace/ui/lib/utils"

import type { RaidBreakdownEntry } from "@/features/goal-farming"
import { EntityIcon, LocationChips, UpgradeIcon } from "@/shared/ui"

import type {
  DailyRaidGoalViewModel,
  DailyRaidLocationViewModel,
  DailyRaidResourceProgress,
  DailyRaidResourceVisual,
} from "../model/daily-raids.domain"
import { dailyRaidResourceKey } from "../model/daily-raids.domain"

export function RaidSchedule({
  entries,
  attemptsUsedByBattle,
  goalsById,
  locationsByBattleId,
  resourceLabels,
  resourceProgress,
  resourceVisuals,
  compact = false,
  layout = "wide",
  testId,
}: {
  entries: RaidBreakdownEntry[]
  attemptsUsedByBattle: ReadonlyMap<BattleId, number>
  goalsById: ReadonlyMap<string, DailyRaidGoalViewModel>
  locationsByBattleId: ReadonlyMap<BattleId, DailyRaidLocationViewModel>
  resourceLabels: ReadonlyMap<string, string>
  resourceProgress: ReadonlyMap<string, DailyRaidResourceProgress>
  resourceVisuals: ReadonlyMap<string, DailyRaidResourceVisual>
  compact?: boolean
  layout?: "wide" | "column"
  testId: string
}) {
  const grouped = groupEntries(entries, goalsById)

  return (
    <div
      className={cn(
        "grid gap-4 md:gap-5",
        layout === "wide" &&
          "md:[grid-template-columns:repeat(auto-fit,minmax(20rem,1fr))] md:items-start"
      )}
      data-testid={testId}
    >
      {grouped.map(({ goal, resources }) => {
        const onlyResource = resources.length === 1 ? resources[0] : undefined
        const onlyVisual = onlyResource
          ? resourceVisuals.get(onlyResource.resourceId)
          : undefined
        const combinesShardIdentity =
          onlyVisual?.kind === "shard" && onlyVisual.unitId === goal.unitId

        return (
          <section key={goal.goalId} className="space-y-2 md:space-y-3">
            {!combinesShardIdentity ? <GoalHeader goal={goal} /> : null}
            <div
              className="grid gap-2 md:gap-3"
              data-testid={`raid-resource-grid-${goal.goalId}`}
            >
              {resources.map(({ resourceId, entries: resourceEntries }) => (
                <ResourceCard
                  key={resourceId}
                  attemptsUsedByBattle={attemptsUsedByBattle}
                  compact={compact}
                  goal={combinesShardIdentity ? goal : undefined}
                  label={resourceLabels.get(resourceId) ?? resourceId}
                  locationsByBattleId={locationsByBattleId}
                  progress={resourceProgress.get(
                    dailyRaidResourceKey(goal.goalId, resourceId)
                  )}
                  resourceEntries={resourceEntries}
                  resourceId={resourceId}
                  visual={resourceVisuals.get(resourceId)}
                />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function GoalHeader({ goal }: { goal: DailyRaidGoalViewModel }) {
  return (
    <div className="flex items-center gap-2 border-b pb-2">
      <UnitIcon goal={goal} className="size-9 md:size-10" />
      <div className="min-w-0 leading-tight">
        <h3 className="truncate font-semibold">{goal.unitLabel}</h3>
        <p className="truncate text-xs text-muted-foreground md:text-sm">
          {goal.targetLabel}
        </p>
      </div>
    </div>
  )
}

function ResourceCard({
  attemptsUsedByBattle,
  compact,
  goal,
  label,
  locationsByBattleId,
  progress,
  resourceEntries,
  resourceId,
  visual,
}: {
  attemptsUsedByBattle: ReadonlyMap<BattleId, number>
  compact: boolean
  goal: DailyRaidGoalViewModel | undefined
  label: string
  locationsByBattleId: ReadonlyMap<BattleId, DailyRaidLocationViewModel>
  progress: DailyRaidResourceProgress | undefined
  resourceEntries: RaidBreakdownEntry[]
  resourceId: string
  visual: DailyRaidResourceVisual | undefined
}) {
  const { t } = useTranslation("dailies")

  return (
    <Card
      className="gap-0 py-2 md:py-3"
      data-testid={`raid-card-${resourceEntries[0]?.goalId}-${resourceId}`}
      size="sm"
    >
      <CardContent className="grid grid-cols-[auto_minmax(0,1fr)] gap-2 px-3 md:gap-3 md:px-4">
        {goal ? (
          <UnitIcon goal={goal} className="size-10 md:size-12" />
        ) : (
          <ResourceIcon label={label} visual={visual} />
        )}
        <div className="min-w-0 space-y-1.5">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <div className="min-w-0 leading-tight">
              {goal ? (
                <>
                  <h3 className="truncate font-semibold">{goal.unitLabel}</h3>
                  <p className="truncate text-xs text-muted-foreground">
                    {goal.targetLabel}
                    {progress ? <ResourceProgress progress={progress} /> : null}
                  </p>
                  <span className="sr-only">{label}</span>
                </>
              ) : (
                <span className="truncate font-medium">{label}</span>
              )}
            </div>
            <Badge className="shrink-0 tabular-nums" variant="secondary">
              {t("schedule.raids", {
                count: resourceEntries.reduce(
                  (sum, entry) => sum + entry.raidsPerformed,
                  0
                ),
              })}
            </Badge>
          </div>
          {!compact ? (
            <div className="flex flex-wrap items-center gap-1.5">
              {!goal && progress ? (
                <ResourceProgress progress={progress} standalone />
              ) : null}
              <LocationChips
                locations={resourceEntries.map((entry) => {
                  const location = locationsByBattleId.get(entry.battleId)
                  const fullyRaided =
                    attemptsUsedByBattle.get(entry.battleId) ===
                    entry.dailyAttempts
                  return {
                    id: `${entry.battleId}-${entry.raidsPerformed}`,
                    icon: location?.icon,
                    label: location
                      ? `${location.label} · ${t("schedule.raids", { count: entry.raidsPerformed })}`
                      : t("schedule.node", {
                          node: entry.battleId,
                          raids: entry.raidsPerformed,
                        }),
                    variant: fullyRaided
                      ? ("secondary" as const)
                      : ("outline" as const),
                  }
                })}
              />
              {resourceEntries.some(
                (entry) =>
                  attemptsUsedByBattle.get(entry.battleId) ===
                  entry.dailyAttempts
              ) ? (
                <span className="sr-only">{t("schedule.fullyRaided")}</span>
              ) : null}
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}

function ResourceProgress({
  progress,
  standalone = false,
}: {
  progress: DailyRaidResourceProgress
  standalone?: boolean
}) {
  const { t } = useTranslation("dailies")
  const value = `${progress.owned} / ${progress.target}`

  return (
    <strong
      aria-label={t("schedule.progress", progress)}
      className={cn("font-semibold tabular-nums", standalone && "text-xs")}
    >
      {standalone ? value : ` · ${value}`}
    </strong>
  )
}

function UnitIcon({
  className,
  goal,
}: {
  className: string
  goal: DailyRaidGoalViewModel
}) {
  return (
    <EntityIcon
      alt={goal.unitLabel}
      className={cn("shrink-0", className)}
      src={
        goal.unitType === "Mow"
          ? mowIcon(goal.unitId)
          : characterIcon(goal.unitId)
      }
    />
  )
}

function ResourceIcon({
  label,
  visual,
}: {
  label: string
  visual: DailyRaidResourceVisual | undefined
}) {
  if (!visual) return <span className="size-10 md:size-12" />

  return (
    <span
      className="flex size-10 shrink-0 items-center justify-center md:size-12"
      data-testid="raid-resource-icon"
    >
      {visual.kind === "upgrade" ? (
        <UpgradeIcon
          className="size-10 md:size-12"
          crafted={visual.crafted}
          id={visual.id}
          rarity={visual.rarity}
        />
      ) : (
        <EntityIcon
          alt={label}
          className="size-10 md:size-12"
          src={characterIcon(visual.unitId)}
        />
      )}
    </span>
  )
}

function groupEntries(
  entries: RaidBreakdownEntry[],
  goalsById: ReadonlyMap<string, DailyRaidGoalViewModel>
) {
  const byGoal = new Map<string, Map<string, RaidBreakdownEntry[]>>()
  for (const entry of entries) {
    const resources = byGoal.get(entry.goalId) ?? new Map()
    const resourceEntries = resources.get(entry.resourceId) ?? []
    resourceEntries.push(entry)
    resources.set(entry.resourceId, resourceEntries)
    byGoal.set(entry.goalId, resources)
  }
  return [...byGoal.entries()]
    .map(([goalId, resources]) => ({
      goal: goalsById.get(goalId) ?? {
        goalId,
        priority: Number.MAX_SAFE_INTEGER,
        unitId: goalId as never,
        unitType: "Character" as const,
        unitLabel: goalId,
        targetLabel: "",
      },
      resources: [...resources.entries()].map(
        ([resourceId, resourceEntries]) => ({
          resourceId,
          entries: resourceEntries,
        })
      ),
    }))
    .sort((left, right) => left.goal.priority - right.goal.priority)
}

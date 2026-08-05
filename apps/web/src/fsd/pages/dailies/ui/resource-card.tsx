import { useTranslation } from "react-i18next"
import { characterIcon, mowIcon } from "@workspace/game-catalog"
import type { BattleId } from "@workspace/game-domain"
import { Badge } from "@workspace/ui/components/badge"
import { Card, CardContent } from "@workspace/ui/components/card"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { cn } from "@workspace/ui/lib/utils"

import { goalTypeIcon } from "@/entities/goal"
import type { RaidBreakdownEntry } from "@/features/goal-farming"
import { EntityIcon, LocationChips, RankBadge, UpgradeIcon } from "@/shared/ui"

import type {
  DailyRaidGoalViewModel,
  DailyRaidLocationViewModel,
  DailyRaidResourceProgress,
  DailyRaidResourceVisual,
} from "../model/daily-raids.domain"
import { isLocationVisible } from "../model/location-visibility"

/** A goal's target, icon-led: Rank goals pair the goal-type icon with the rank icon (an accessible
 * name is enough, no text — see `RankBadge`'s `showLabel={false}`); every other kind pairs its
 * goal-type icon with the existing text label, matching the Create Goal sheet's goal-type picker
 * treatment. */
export function GoalTargetBadge({ goal }: { goal: DailyRaidGoalViewModel }) {
  if (goal.goalKind === "Rank" && goal.targetRank) {
    return (
      <span className="inline-flex items-center gap-1">
        <EntityIcon
          alt=""
          className="size-3.5 shrink-0"
          src={goalTypeIcon(goal.goalKind, goal.unitType)}
        />
        <RankBadge rank={goal.targetRank} showLabel={false} />
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1">
      <EntityIcon
        alt=""
        className="size-3.5 shrink-0"
        src={goalTypeIcon(goal.goalKind, goal.unitType)}
      />
      {goal.targetLabel}
    </span>
  )
}

export function ResourceCard({
  attemptsLeftByBattle,
  attemptsUsedByBattle,
  compact,
  emphasis,
  goal,
  label,
  locationsByBattleId,
  progress,
  resourceEntries,
  resourceId,
  visual,
}: {
  // Real, per-node attempts remaining today (see daily-raids-energy.ts) — the "location" emphasis
  // path de-dupes a location out of this list once it hits zero, deferring to Today's Attempts.
  attemptsLeftByBattle: ReadonlyMap<BattleId, number>
  attemptsUsedByBattle: ReadonlyMap<BattleId, number>
  compact: boolean
  emphasis: "material" | "location"
  goal: DailyRaidGoalViewModel | undefined
  label: string
  locationsByBattleId: ReadonlyMap<BattleId, DailyRaidLocationViewModel>
  progress: DailyRaidResourceProgress | undefined
  resourceEntries: RaidBreakdownEntry[]
  resourceId: string
  visual: DailyRaidResourceVisual | undefined
}) {
  const { t } = useTranslation("dailies")

  if (emphasis === "location") {
    // A location with zero real attempts left today moves to Today's Attempts instead of listing
    // here — once every location for this entry is spent, the whole card is omitted (nothing left
    // to raid). Missing real data (e.g. an event-campaign node) is treated as "not exhausted"
    // rather than guessed at.
    const visibleEntries = resourceEntries.filter((entry) =>
      isLocationVisible(entry, attemptsLeftByBattle)
    )
    if (visibleEntries.length === 0) return null

    return (
      <Card
        className="gap-0 py-2 md:py-3"
        data-testid={`raid-card-${resourceEntries[0]?.goalId}-${resourceId}`}
        size="sm"
      >
        <CardContent className="flex min-w-0 items-start gap-2 px-3 md:px-4">
          {goal ? (
            <UnitIcon goal={goal} className="size-10 md:size-12" />
          ) : (
            <div className="flex shrink-0 flex-col items-center gap-0.5">
              <ResourceIconWithTooltip label={label} visual={visual} />
              {progress ? (
                <ResourceProgress progress={progress} standalone />
              ) : null}
            </div>
          )}
          <div className="min-w-0 flex-1 space-y-1.5">
            {goal ? (
              <div className="leading-tight">
                <h3 className="truncate font-semibold">{goal.unitLabel}</h3>
                <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                  <GoalTargetBadge goal={goal} />
                  {progress ? <ResourceProgress progress={progress} /> : null}
                </p>
                <span className="sr-only">{label}</span>
              </div>
            ) : null}
            <div className="space-y-1.5">
              {visibleEntries.map((entry) => {
                const location = locationsByBattleId.get(entry.battleId)
                return (
                  <div
                    key={`${entry.battleId}-${entry.raidsPerformed}`}
                    className="flex items-center gap-2 rounded-lg border px-2 py-1.5"
                    data-testid={`raid-location-${entry.battleId}`}
                  >
                    {location?.icon ? (
                      <EntityIcon
                        alt=""
                        className="size-6 shrink-0"
                        src={location.icon}
                      />
                    ) : null}
                    <div className="min-w-0 flex-1 leading-tight">
                      <div className="truncate text-sm font-medium">
                        {location?.fullName ?? entry.battleId}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {t("schedule.battle", {
                          number: location?.nodeNumber ?? entry.battleId,
                        })}
                      </div>
                    </div>
                    <Badge className="shrink-0 tabular-nums" variant="outline">
                      {entry.raidsPerformed === entry.dailyAttempts
                        ? t("schedule.maxRaids")
                        : t("schedule.raids", { count: entry.raidsPerformed })}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

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
                  <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                    <GoalTargetBadge goal={goal} />
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
                      ? `${location.shortLabel} · ${t("schedule.raids", { count: entry.raidsPerformed })}`
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

export function UnitIcon({
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
  className = "size-10 md:size-12",
  label,
  visual,
}: {
  className?: string
  label: string
  visual: DailyRaidResourceVisual | undefined
}) {
  if (!visual) return <span className={className} />

  return (
    <span
      className={cn("flex shrink-0 items-center justify-center", className)}
      data-testid="raid-resource-icon"
    >
      {visual.kind === "upgrade" ? (
        <UpgradeIcon
          className={className}
          crafted={visual.crafted}
          id={visual.id}
          rarity={visual.rarity}
        />
      ) : (
        <EntityIcon
          alt={label}
          className={className}
          src={characterIcon(visual.unitId)}
        />
      )}
    </span>
  )
}

/** `ResourceIcon` with its name available as a tooltip on hover/focus, since the icon alone
 * replaces the visible resource name in the "location" emphasis card and in Today's Attempts. */
export function ResourceIconWithTooltip({
  className,
  label,
  visual,
}: {
  className?: string
  label: string
  visual: DailyRaidResourceVisual | undefined
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="shrink-0">
          <ResourceIcon className={className} label={label} visual={visual} />
        </span>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

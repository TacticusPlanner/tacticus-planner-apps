import { useTranslation } from "react-i18next"
import { Eye, Lock, MoreHorizontal, Target, UserPlus } from "lucide-react"
import { characterIcon, rankIcon, traitIcon } from "@workspace/game-catalog"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { cn } from "@workspace/ui/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"

import { rankTone } from "@/entities/legendary-event"
import type {
  LeaderboardUnitRow,
  LegendaryEventLaneId,
  ObjectiveIconModel,
} from "@/entities/legendary-event"
import { UnitGoalBadge } from "@/entities/goal"
import {
  CompactProgression,
  EmptyState,
  EntityIcon,
  RankBadge,
  RarityIcon,
  ObjectiveIcon,
} from "@/shared/ui"

import type { LeaderboardBody } from "../../../model/legendary-event/leaderboard/leaderboard.view-model"

/** The traits a leaderboard marks after the unit's name (spec: trait markers). */
const LEADERBOARD_TRAIT_MARKERS = ["Healer", "Mechanic"] as const

/** Portrait, localized name, the goal badge, the Healer / Mechanic markers, the Goals Preview
 *  marker and, for a unit the roster lacks, the locked marker. */
export function LeaderboardUnit({
  row,
  name,
  goalLines = [],
  previewed = false,
}: {
  row: LeaderboardUnitRow
  name: string
  goalLines?: readonly string[]
  /** Shown at its goal targets by Goals Preview. */
  previewed?: boolean
}) {
  const { t } = useTranslation(["legendaryEvents", "traits"])
  const markers = LEADERBOARD_TRAIT_MARKERS.filter((trait) =>
    row.unit.traits.includes(trait)
  )
  return (
    <span className="flex min-w-0 items-center gap-2">
      <EntityIcon
        size="portrait-sm"
        alt=""
        className={cn(
          "shrink-0 rounded-full",
          row.ownership === "locked" && "opacity-50 grayscale"
        )}
        src={characterIcon(row.unit.id)}
      />
      <span
        className="truncate font-medium"
        data-testid="leaderboard-unit-name"
      >
        {name}
      </span>
      <UnitGoalBadge label={t("goalBadge.label")} lines={goalLines} />
      {markers.map((trait) => {
        const label = t(`traits:${trait}`, { defaultValue: trait })
        return (
          <Tooltip key={trait}>
            <TooltipTrigger asChild>
              <span
                className="inline-flex shrink-0"
                data-testid="leaderboard-trait"
                data-trait={trait}
              >
                <EntityIcon size="icon" alt="" src={traitIcon(trait)} />
                <span className="sr-only">{label}</span>
              </span>
            </TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
          </Tooltip>
        )
      })}
      {previewed ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className="inline-flex shrink-0 text-primary"
              data-testid="leaderboard-preview-marker"
            >
              <Eye aria-hidden="true" className="size-icon" />
              <span className="sr-only">{t("goalsPreview.marker")}</span>
            </span>
          </TooltipTrigger>
          <TooltipContent>{t("goalsPreview.marker")}</TooltipContent>
        </Tooltip>
      ) : null}
      {row.ownership === "locked" ? (
        <span
          className="inline-flex shrink-0 items-center gap-1 rounded-full border px-1.5 py-0.5 text-xs text-muted-foreground"
          data-testid="leaderboard-locked"
        >
          <Lock aria-hidden="true" className="size-icon-sm" />
          {t("leaderboard.locked")}
        </span>
      ) : null}
    </span>
  )
}

/** Add to new team in a row's menu: the lanes it offers (one on a lane leaderboard, every lane
 *  allowing the unit on Overview, which names each lane) and the launcher. */
export interface LeaderboardAddToTeam {
  laneIds: readonly LegendaryEventLaneId[]
  nameLane: boolean
  onSelect: (laneId: LegendaryEventLaneId) => void
}

/** A row's actions menu (spec: leaderboard rows have an actions menu with Create goal, then Add to
 *  new team): a three-dots button, 44px on the mobile cards. */
export function LeaderboardRowActions({
  name,
  onCreateGoal,
  addToTeam,
  size = "table",
}: {
  name: string
  onCreateGoal: () => void
  /** Absent while teams cannot be edited. */
  addToTeam?: LeaderboardAddToTeam
  size?: "table" | "card"
}) {
  const { t } = useTranslation("legendaryEvents")
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label={t("leaderboardActions.menu", { name })}
          className={size === "card" ? "size-11 shrink-0" : undefined}
          data-testid="leaderboard-row-menu"
          size={size === "card" ? "icon" : "icon-sm"}
          variant="ghost"
        >
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          data-testid="leaderboard-create-goal"
          onSelect={onCreateGoal}
        >
          <Target />
          {t("leaderboardActions.createGoal")}
        </DropdownMenuItem>
        {addToTeam?.laneIds.map((laneId) => (
          <DropdownMenuItem
            data-lane={laneId}
            data-testid="leaderboard-add-to-team"
            key={laneId}
            onSelect={() => addToTeam.onSelect(laneId)}
          >
            <UserPlus />
            {addToTeam.nameLane
              ? t("leaderboardActions.addToTeamOnLane", {
                  lane: t(`lanes.${laneId}`),
                })
              : t("leaderboardActions.addToTeam")}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** The owned unit's rarity icon; nothing for a locked or unknown unit. */
export function LeaderboardRarity({ row }: { row: LeaderboardUnitRow }) {
  if (!row.rarity) return null
  return (
    <span data-testid="leaderboard-rarity" data-rarity={row.rarity}>
      <RarityIcon rarity={row.rarity} />
    </span>
  )
}

/** The owned unit's progression as the collection's roster view shows it (`CompactProgression`):
 *  the rarity icon, then the star icon with the star count (or the wings); nothing for a locked or
 *  unknown unit. */
export function LeaderboardProgression({ row }: { row: LeaderboardUnitRow }) {
  if (!row.rarity || !row.progression) return null
  return (
    <span data-rarity={row.rarity}>
      <CompactProgression
        data-testid="leaderboard-progression"
        value={row.progression}
      />
    </span>
  )
}

/** The owned unit's rank icon on a background in its rank colour, as the team tiles draw it;
 *  nothing for a locked or unknown unit. */
export function LeaderboardRankTile({ row }: { row: LeaderboardUnitRow }) {
  const { t } = useTranslation("progression")
  if (!row.rank) return null
  const label = t(`ranks.${row.rank}`)
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className="inline-flex h-7 w-10 items-center justify-center rounded-md border"
          data-rank={row.rank}
          data-testid="leaderboard-rank"
          style={rankTone(row.rank)}
        >
          <EntityIcon size="icon" alt="" src={rankIcon(row.rank)} />
          <span className="sr-only">{label}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

/** The owned unit's rank badge; nothing for a locked or unknown unit. */
export function LeaderboardRank({
  row,
  showLabel = false,
}: {
  row: LeaderboardUnitRow
  showLabel?: boolean
}) {
  if (!row.rank) return null
  return (
    <span data-testid="leaderboard-rank" data-rank={row.rank}>
      <RankBadge rank={row.rank} showLabel={showLabel} tooltip={!showLabel} />
    </span>
  )
}

/** Whether a unit meets one objective: its icon, full-strength or muted, plus text for assistive
 *  technology (spec: objective icons as indicators). */
export function ObjectiveIndicator({
  met,
  label,
  icon,
  size = "md",
}: {
  met: boolean
  label: string
  icon: ObjectiveIconModel | undefined
  /** `sm` for the Overview lane cells, where five indicators sit above each figure. */
  size?: "sm" | "md"
}) {
  const { t } = useTranslation("legendaryEvents")
  const text = t(
    met ? "leaderboard.objectiveMet" : "leaderboard.objectiveNotMet",
    { objective: label }
  )
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-flex items-center justify-center",
            size === "sm" ? "size-5" : "size-6"
          )}
          data-met={met}
          data-testid="leaderboard-objective"
        >
          {icon ? (
            <ObjectiveIcon icon={icon} muted={!met} />
          ) : (
            <span
              aria-hidden="true"
              className={cn(
                "size-2.5 rounded-full",
                met ? "bg-(--event-legendary)" : "bg-muted-foreground/30"
              )}
            />
          )}
          <span className="sr-only">{text}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent>{text}</TooltipContent>
    </Tooltip>
  )
}

/** The empty bodies a leaderboard can show instead of rows. */
export function LeaderboardEmptyBody({
  body,
  onClearFilter,
}: {
  body: Exclude<LeaderboardBody<unknown>, { kind: "rows" }>
  onClearFilter: () => void
}) {
  const { t } = useTranslation("legendaryEvents")
  const message = {
    noEligible: "leaderboard.noEligible",
    noUnlocked: "leaderboard.noUnlocked",
    noneInTeams: "leaderboard.noneInTeams",
    noneMatch: "leaderboard.noneMatch",
  } as const
  const testId = {
    noEligible: "leaderboard-no-eligible",
    noUnlocked: "leaderboard-no-unlocked",
    noneInTeams: "leaderboard-none-in-teams",
    noneMatch: "leaderboard-none-match",
  } as const
  // No unit can play here at all: nothing to clear. Every other body comes from a filter.
  if (body.kind === "noEligible") {
    return (
      <EmptyState
        description={t(message.noEligible)}
        testId={testId.noEligible}
        variant="empty"
      />
    )
  }
  return (
    <EmptyState
      actions={
        <Button
          data-testid="leaderboard-clear-filter"
          onClick={onClearFilter}
          variant="outline"
        >
          {t("leaderboard.clearFilter")}
        </Button>
      }
      description={t(message[body.kind])}
      testId={testId[body.kind]}
      variant="no-match"
    />
  )
}

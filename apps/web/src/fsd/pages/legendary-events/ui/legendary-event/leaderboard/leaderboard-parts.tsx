import { useTranslation } from "react-i18next"
import { Lock } from "lucide-react"
import { characterIcon } from "@workspace/game-catalog"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import {
  ObjectiveIcon,
  type LeaderboardUnitRow,
  type ObjectiveIconModel,
} from "@/entities/legendary-event"
import { EntityIcon, RankBadge, RarityIcon } from "@/shared/ui"

import type { LeaderboardBody } from "./leaderboard.view-model"

/** Portrait, localized name and, for a unit the roster lacks, the locked marker. */
export function LeaderboardUnit({
  row,
  name,
}: {
  row: LeaderboardUnitRow
  name: string
}) {
  const { t } = useTranslation("legendaryEvents")
  return (
    <span className="flex min-w-0 items-center gap-2">
      <EntityIcon
        alt=""
        className={cn(
          "size-8 shrink-0 rounded-full",
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
      {row.ownership === "locked" ? (
        <span
          className="inline-flex shrink-0 items-center gap-1 rounded-full border px-1.5 py-0.5 text-xs text-muted-foreground"
          data-testid="leaderboard-locked"
        >
          <Lock aria-hidden="true" className="size-3" />
          {t("leaderboard.locked")}
        </span>
      ) : null}
    </span>
  )
}

/** The owned unit's rarity icon; nothing for a locked or unknown unit. */
export function LeaderboardRarity({ row }: { row: LeaderboardUnitRow }) {
  if (!row.rarity) return null
  return (
    <span data-testid="leaderboard-rarity" data-rarity={row.rarity}>
      <RarityIcon className="size-5" rarity={row.rarity} />
    </span>
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
}: {
  met: boolean
  label: string
  icon: ObjectiveIconModel | undefined
}) {
  const { t } = useTranslation("legendaryEvents")
  const text = t(
    met ? "leaderboard.objectiveMet" : "leaderboard.objectiveNotMet",
    { objective: label }
  )
  return (
    <span
      className="inline-flex size-6 items-center justify-center"
      data-met={met}
      data-testid="leaderboard-objective"
      title={text}
    >
      {icon ? (
        <ObjectiveIcon className="size-5" icon={icon} muted={!met} />
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
  if (body.kind === "noneMatch") {
    return (
      <div
        className="flex flex-col items-start gap-2 text-sm text-muted-foreground"
        data-testid="leaderboard-none-match"
      >
        <p>{t("leaderboard.noneMatch")}</p>
        <Button
          data-testid="leaderboard-clear-filter"
          onClick={onClearFilter}
          size="sm"
          variant="outline"
        >
          {t("leaderboard.clearFilter")}
        </Button>
      </div>
    )
  }
  return (
    <p
      className="text-sm text-muted-foreground"
      data-testid={
        body.kind === "noEligible"
          ? "leaderboard-no-eligible"
          : "leaderboard-no-unlocked"
      }
    >
      {t(
        body.kind === "noEligible"
          ? "leaderboard.noEligible"
          : "leaderboard.noUnlocked"
      )}
    </p>
  )
}

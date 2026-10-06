import { useTranslation } from "react-i18next"
import { Check, Lock, Minus } from "lucide-react"
import { characterIcon } from "@workspace/game-catalog"
import { cn } from "@workspace/ui/lib/utils"

import type { LeaderboardRow } from "@/entities/legendary-event"
import { EntityIcon, RankBadge, RarityIcon } from "@/shared/ui"

/** Portrait, localized name and, for a unit the roster lacks, the locked marker. */
export function LeaderboardUnit({
  row,
  name,
}: {
  row: LeaderboardRow
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
export function LeaderboardRarity({ row }: { row: LeaderboardRow }) {
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
  row: LeaderboardRow
  showLabel?: boolean
}) {
  if (!row.rank) return null
  return (
    <span data-testid="leaderboard-rank" data-rank={row.rank}>
      <RankBadge rank={row.rank} showLabel={showLabel} tooltip={!showLabel} />
    </span>
  )
}

/** Whether a unit meets one objective: an icon plus text for assistive technology. */
export function ObjectiveIndicator({
  met,
  label,
}: {
  met: boolean
  label: string
}) {
  const { t } = useTranslation("legendaryEvents")
  const text = t(
    met ? "leaderboard.objectiveMet" : "leaderboard.objectiveNotMet",
    {
      objective: label,
    }
  )
  const Icon = met ? Check : Minus
  return (
    <span
      className={cn(
        "inline-flex size-6 items-center justify-center rounded-full",
        met
          ? "bg-(--event-legendary)/20 text-foreground"
          : "text-muted-foreground/60"
      )}
      data-met={met}
      data-testid="leaderboard-objective"
      title={text}
    >
      <Icon aria-hidden="true" className="size-4" />
      <span className="sr-only">{text}</span>
    </span>
  )
}

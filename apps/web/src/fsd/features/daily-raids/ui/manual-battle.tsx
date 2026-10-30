import { EllipsisVertical, Swords } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { BattleId } from "@workspace/game-domain"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { cn } from "@workspace/ui/lib/utils"

import type { DailyRaidLocationViewModel } from "../model/daily-raids.domain"

/** Marks a location that must be played, not raided: raids need 3 medals. `compact` shows only the
 *  icon (inside a location chip), keeping the text for screen readers. */
export function ManualBattleBadge({
  className,
  compact = false,
}: {
  className?: string
  compact?: boolean
}) {
  const { t } = useTranslation("dailies")
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 text-xs text-amber-700 dark:text-amber-400",
        className
      )}
      title={t("manualBattle.help")}
      data-testid="manual-battle-badge"
    >
      <Swords aria-hidden className="size-3.5" />
      <span className={cn(compact && "sr-only")}>
        {t("manualBattle.badge")}
      </span>
    </span>
  )
}

/**
 * "Can't raid this?" for a card's planned locations: picking one opens the battle progress dialog
 * on that battle, where the player records it as below 3 medals.
 */
export function CantRaidMenu({
  battleIds,
  locationsByBattleId,
  onCantRaid,
}: {
  battleIds: readonly BattleId[]
  locationsByBattleId: ReadonlyMap<BattleId, DailyRaidLocationViewModel>
  onCantRaid: (battleId: BattleId) => void
}) {
  const { t } = useTranslation("dailies")
  const unique = [...new Set(battleIds)]
  if (unique.length === 0) return null
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 shrink-0"
          aria-label={t("manualBattle.menu")}
          data-testid="cant-raid-menu"
        >
          <EllipsisVertical aria-hidden className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {unique.map((battleId) => {
          const location = locationsByBattleId.get(battleId)
          return (
            <DropdownMenuItem
              key={battleId}
              onSelect={() => onCantRaid(battleId)}
              data-testid={`cant-raid-${battleId}`}
            >
              {t("manualBattle.cantRaid", {
                location: location?.shortLabel ?? battleId,
              })}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

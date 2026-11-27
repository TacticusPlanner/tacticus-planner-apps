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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"

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
    // Hover explains it; a tap keeps the job of the chip or row it sits in.
    <Tooltip>
      <TooltipTrigger asChild disableTouchToggle>
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1 text-xs text-warning-foreground",
            className
          )}
          data-testid="manual-battle-badge"
        >
          <Swords aria-hidden className="size-icon-sm" />
          <span className={cn(compact && "sr-only")}>
            {t("manualBattle.badge")}
          </span>
        </span>
      </TooltipTrigger>
      <TooltipContent>{t("manualBattle.help")}</TooltipContent>
    </Tooltip>
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
          <EllipsisVertical aria-hidden className="size-icon" />
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

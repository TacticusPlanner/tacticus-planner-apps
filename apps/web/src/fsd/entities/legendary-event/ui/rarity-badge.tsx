import { rarityIcon } from "@workspace/game-catalog"
import type { Rarity } from "@workspace/game-domain"
import { cn } from "@workspace/ui/lib/utils"

import { EntityIcon } from "@/shared/ui"

/**
 * A rarity as the game's lettered hexagon (`rarityIcon`, the art the shared `RarityIcon` draws
 * elsewhere), without that component's own tooltip and label: on a chip it is decorative, as the
 * chip's accessible name and details already carry the rarity.
 */
export function RarityBadge({
  rarity,
  className,
}: {
  rarity: Rarity
  className?: string
}) {
  return (
    <span
      aria-hidden="true"
      className={cn("block size-4.5 shrink-0", className)}
      data-rarity={rarity}
      data-testid="unit-chip-rarity"
    >
      <EntityIcon alt="" className="size-full" src={rarityIcon(rarity)} />
    </span>
  )
}

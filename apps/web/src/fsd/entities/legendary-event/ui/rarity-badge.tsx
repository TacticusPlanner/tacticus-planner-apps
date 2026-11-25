import { rarityIcon } from "@workspace/game-catalog"
import type { Rarity } from "@workspace/game-domain"
import { cn } from "@workspace/ui/lib/utils"

import { EntityIcon, entityIconClassName } from "@/shared/ui"
import type { EntityIconSize } from "@/shared/ui"

/**
 * A rarity as the game's lettered hexagon (`rarityIcon`, the art the shared `RarityIcon` draws
 * elsewhere), without that component's own tooltip and label: on a chip it is decorative, as the
 * chip's accessible name and details already carry the rarity. `size` is a step on the style guide's
 * icon scale: `icon-sm` on a chip's portrait, `icon` next to text.
 */
export function RarityBadge({
  rarity,
  size = "icon-sm",
  className,
}: {
  rarity: Rarity
  size?: EntityIconSize
  className?: string
}) {
  return (
    <span
      aria-hidden="true"
      className={cn("block shrink-0", entityIconClassName(size), className)}
      data-rarity={rarity}
      data-testid="unit-chip-rarity"
    >
      <EntityIcon alt="" className="size-full" src={rarityIcon(rarity)} />
    </span>
  )
}

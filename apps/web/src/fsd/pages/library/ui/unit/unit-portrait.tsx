import type { Rarity } from "@workspace/game-domain"
import { cn } from "@workspace/ui/lib/utils"

import { EntityIcon } from "@/shared/ui"

/**
 * The unit page's round portrait with a rarity-coloured ring. A stand-in until Collection's round
 * portrait (inside `UnitTile`, with its stars and rank overlays) is on main; the Collection
 * click-through change swaps it in here. `greyed` is the not-unlocked look.
 */
export function UnitPortrait({
  src,
  rarity,
  greyed = false,
  size,
}: {
  src: string
  rarity: Rarity
  greyed?: boolean
  size: number
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 overflow-hidden rounded-full bg-muted",
        greyed ? "border-2 border-dashed opacity-70 grayscale" : "border-4"
      )}
      style={{
        width: size,
        height: size,
        borderColor: `var(--rarity-${rarity.toLowerCase()})`,
      }}
      data-testid="unit-portrait"
      data-greyed={greyed || undefined}
    >
      <EntityIcon src={src} alt="" className="size-full object-cover" />
    </span>
  )
}

import type { Rarity } from "@workspace/game-domain"
import { cn } from "@workspace/ui/lib/utils"

import { EntityIcon, portraitClassName } from "@/shared/ui"
import type { PortraitSize } from "@/shared/ui"

import { rarityColor } from "./unit-styles"
import { portraitRingClassName } from "./unit-portrait.model"

/**
 * A unit's round portrait at one of the style guide's portrait sizes (`sm` 40px, `md` 64px, `lg`
 * 96px, `hero` 128px for a unit page's header), ringed in its rarity colour. `greyed` is the
 * not-unlocked look: a dashed neutral ring and a greyscale portrait. Without a rarity the ring is
 * neutral. Size classes stay out of `className`; it is for placement only.
 */
export function UnitPortrait({
  src,
  size,
  rarity,
  greyed = false,
  alt = "",
  className,
}: {
  src: string
  size: PortraitSize
  rarity?: Rarity
  greyed?: boolean
  alt?: string
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 overflow-hidden rounded-full bg-portrait",
        portraitClassName(size),
        greyed
          ? "border-2 border-dashed border-border opacity-70 grayscale"
          : portraitRingClassName(size),
        className
      )}
      style={
        !greyed && rarity !== undefined
          ? { borderColor: rarityColor(rarity) }
          : undefined
      }
      data-testid="unit-portrait"
      data-size={size}
      data-greyed={greyed || undefined}
    >
      <EntityIcon src={src} alt={alt} className="size-full object-cover" />
    </span>
  )
}

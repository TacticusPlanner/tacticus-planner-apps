import type { Rarity } from "@workspace/game-domain"
import { cn } from "@workspace/ui/lib/utils"

import { EntityIcon, portraitClassName } from "@/shared/ui"
import type { PortraitSize } from "@/shared/ui"

import { rarityColor } from "./unit-styles"
import { portraitRingClassName } from "./unit-portrait.model"

/**
 * A unit's round portrait at one of the style guide's portrait sizes (`portrait-sm` 40px,
 * `portrait-md` 64px, `portrait-lg` 96px, `portrait-xl` 128px for a unit page's header), ringed in its rarity colour. `greyed` is the
 * not-unlocked look: a thin dashed ring, still in the rarity colour, and a greyscale portrait.
 * Without a rarity the ring is neutral. Size classes stay out of `className`; it is for placement only.
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
          ? "border-2 border-dashed opacity-70 grayscale"
          : portraitRingClassName(size),
        rarity === undefined && "border-border",
        className
      )}
      style={
        rarity === undefined ? undefined : { borderColor: rarityColor(rarity) }
      }
      data-testid="unit-portrait"
      data-size={size}
      data-greyed={greyed || undefined}
    >
      <EntityIcon src={src} alt={alt} className="size-full object-cover" />
    </span>
  )
}

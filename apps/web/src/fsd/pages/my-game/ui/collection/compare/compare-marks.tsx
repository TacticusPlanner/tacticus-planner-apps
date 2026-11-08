import type { ReactNode } from "react"
import {
  abilityIcon,
  EquipmentIcons,
  progressionVisual,
  rankIcon,
} from "@workspace/game-catalog"
import {
  equipmentIdSchema,
  progressionRarity,
  type Progression,
  type Rank,
} from "@workspace/game-domain"
import { cn } from "@workspace/ui/lib/utils"

import { EntityIcon, RarityIcon } from "@/shared/ui"

import type { ProgressionPart } from "../../../model/compare-chips"

/**
 * A before → after pair drawn with icons. The icons are decorative; `label` is the text a screen
 * reader (and a hover) gets instead, such as "Diamond I → Diamond III".
 */
export function FromToMarks({
  from,
  to,
  label,
  className,
}: {
  from: ReactNode
  to: ReactNode
  label: string
  className?: string
}) {
  return (
    <span
      className={cn("inline-flex items-center gap-1", className)}
      title={label}
    >
      <span aria-hidden className="inline-flex items-center gap-1">
        {from}
        <span className="text-muted-foreground">→</span>
        {to}
      </span>
      <span className="sr-only">{label}</span>
    </span>
  )
}

/** A progression as its rarity icon plus one star icon and the star count (or the wings). With
 *  `emphasis`, the other half is faded: the rarity for ascensions, the stars for promotions. */
export function ProgressionMark({
  value,
  large = false,
  emphasis,
}: {
  value: Progression
  large?: boolean
  emphasis?: ProgressionPart
}) {
  const visual = progressionVisual(value)
  return (
    <span className="inline-flex items-center gap-0.5 tabular-nums">
      <RarityIcon
        rarity={progressionRarity(value)}
        className={cn(
          large ? "size-5" : "size-4",
          emphasis === "stars" && fadedPart
        )}
      />
      {visual.kind === "none" ? null : (
        <span
          className={cn(
            "inline-flex items-center gap-0.5",
            emphasis === "rarity" && fadedPart
          )}
          data-part="stars"
        >
          <EntityIcon
            alt=""
            src={visual.icon}
            className={
              visual.kind === "wings"
                ? large
                  ? "h-4 w-auto"
                  : "h-3 w-auto"
                : large
                  ? "size-3.5"
                  : "size-3"
            }
          />
          {visual.kind === "stars" ? visual.count : null}
        </span>
      )}
    </span>
  )
}

const fadedPart = "opacity-35"

export function RankMark({
  rank,
  large = false,
}: {
  rank: Rank
  large?: boolean
}) {
  return (
    <EntityIcon
      alt=""
      src={rankIcon(rank)}
      className={cn("shrink-0", large ? "size-5" : "size-4")}
    />
  )
}

export function AbilityMark({
  abilityId,
  large = false,
}: {
  abilityId: string
  large?: boolean
}) {
  return (
    <EntityIcon
      alt=""
      src={abilityIcon(abilityId)}
      className={cn("shrink-0 rounded-sm", large ? "size-5" : "size-4")}
    />
  )
}

/** An item's icon with its level in the corner, as the unit tiles draw equipped items. */
export function ItemMark({
  equipmentId,
  level,
}: {
  equipmentId: string
  level: number
}) {
  return (
    <span className="relative inline-flex size-7 shrink-0 overflow-hidden rounded border bg-muted">
      <EntityIcon
        alt=""
        src={EquipmentIcons.icon(equipmentIdSchema.parse(equipmentId))}
        fallback={EquipmentIcons.fallback}
        className="size-full object-contain"
      />
      <span className="absolute right-0.5 bottom-0 text-2xs leading-none font-bold text-white tabular-nums [text-shadow:0_0_2px_black]">
        {level}
      </span>
    </span>
  )
}

import type { ReactNode } from "react"
import { abilityIcon, EquipmentIcons, rankIcon } from "@workspace/game-catalog"
import { equipmentIdSchema } from "@workspace/game-domain"
import type { Progression, Rank } from "@workspace/game-domain"
import { cn } from "@workspace/ui/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"

import { CompactProgression, EntityIcon } from "@/shared/ui"

import type { ProgressionPart } from "../../../model/compare-chips"
import { useAbilityName } from "../../../model/use-ability-name"

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
    <Tooltip>
      <TooltipTrigger asChild disableTouchToggle>
        <span className={cn("inline-flex items-center gap-1", className)}>
          <span aria-hidden className="inline-flex items-center gap-1">
            {from}
            <span className="text-muted-foreground">→</span>
            {to}
          </span>
          <span className="sr-only">{label}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

/** A progression as its rarity icon plus one star icon and the star count (or the wings), the shared
 *  `CompactProgression`. With `emphasis`, the other half is faded: the rarity for ascensions, the
 *  stars for promotions. */
export function ProgressionMark({
  value,
  emphasis,
}: {
  value: Progression
  emphasis?: ProgressionPart
}) {
  return (
    <CompactProgression
      fade={
        emphasis === "stars"
          ? "rarity"
          : emphasis === "rarity"
            ? "stars"
            : undefined
      }
      value={value}
    />
  )
}

export function RankMark({ rank }: { rank: Rank }) {
  return (
    <EntityIcon size="icon" alt="" src={rankIcon(rank)} className="shrink-0" />
  )
}

/** An ability's icon, named by the ability (the compare chips also say it in their label). */
export function AbilityMark({ abilityId }: { abilityId: string }) {
  const name = useAbilityName()(abilityId)
  return (
    <EntityIcon
      size="icon"
      alt={name}
      src={abilityIcon(abilityId)}
      className="shrink-0 rounded-sm"
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
    <span className="relative inline-flex size-8 shrink-0 overflow-hidden rounded-sm border bg-muted">
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

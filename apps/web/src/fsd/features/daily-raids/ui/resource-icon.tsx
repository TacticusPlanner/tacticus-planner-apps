import { characterIcon } from "@workspace/game-catalog"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { cn } from "@workspace/ui/lib/utils"

import { EntityIcon, UpgradeIcon } from "@/shared/ui"

import type { DailyRaidResourceVisual } from "../model/daily-raids.domain"

/** A resource's icon: an upgrade material's rarity-framed icon, or a unit's shard icon. Shared
 * between `pages/dailies`'s resource cards and the home Daily Raids widget's compact rows. */
export function ResourceIcon({
  className = "size-10 md:size-12",
  label,
  visual,
}: {
  className?: string
  label: string
  visual: DailyRaidResourceVisual | undefined
}) {
  if (!visual) return <span className={className} />

  return (
    <span
      className={cn("flex shrink-0 items-center justify-center", className)}
      data-testid="raid-resource-icon"
    >
      {visual.kind === "upgrade" ? (
        <UpgradeIcon
          className={className}
          crafted={visual.crafted}
          id={visual.id}
          rarity={visual.rarity}
        />
      ) : (
        <EntityIcon
          alt={label}
          className={className}
          src={characterIcon(visual.unitId)}
        />
      )}
    </span>
  )
}

/** `ResourceIcon` with its name available as a tooltip on hover/focus, since the icon alone
 * replaces the visible resource name in location-emphasis rendering. */
export function ResourceIconWithTooltip({
  className,
  label,
  visual,
}: {
  className?: string
  label: string
  visual: DailyRaidResourceVisual | undefined
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          aria-label={label}
          className="shrink-0 border-0 bg-transparent p-0"
          type="button"
        >
          <ResourceIcon className={className} label={label} visual={visual} />
        </button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

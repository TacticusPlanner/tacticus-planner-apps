import { characterIcon } from "@workspace/game-catalog"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { cn } from "@workspace/ui/lib/utils"

import { EntityIcon, entityIconClassName, UpgradeIcon } from "@/shared/ui"
import type { EntityIconSize } from "@/shared/ui"

import type { DailyRaidResourceVisual } from "../model/daily-raids.domain"

/** A resource's icon: an upgrade material's rarity-framed icon, or a unit's shard icon. Shared
 * between `pages/dailies`'s resource cards and the home Daily Raids widget's compact rows. `size`
 * is the style guide's icon role: `tile` on a card, `row` in a list row. */
export function ResourceIcon({
  size = "tile",
  label,
  visual,
}: {
  size?: ResourceIconSize
  label: string
  visual: DailyRaidResourceVisual | undefined
}) {
  if (!visual) {
    return <span className={cn("shrink-0", entityIconClassName(size))} />
  }

  return (
    <span
      className="flex shrink-0 items-center justify-center"
      data-testid="raid-resource-icon"
    >
      {visual.kind === "upgrade" ? (
        <UpgradeIcon
          size={size}
          crafted={visual.crafted}
          id={visual.id}
          rarity={visual.rarity}
        />
      ) : (
        <EntityIcon
          alt={label}
          size={size}
          src={characterIcon(visual.unitId)}
        />
      )}
    </span>
  )
}

type ResourceIconSize = Extract<EntityIconSize, "row" | "tile">

/** `ResourceIcon` with its name available as a tooltip on hover/focus, since the icon alone
 * replaces the visible resource name in location-emphasis rendering. */
export function ResourceIconWithTooltip({
  size,
  label,
  visual,
}: {
  size?: ResourceIconSize
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
          <ResourceIcon size={size} label={label} visual={visual} />
        </button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

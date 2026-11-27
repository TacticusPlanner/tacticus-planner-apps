import { characterIcon } from "@workspace/game-catalog"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { cn } from "@workspace/ui/lib/utils"
import { Pressable } from "@workspace/ui/components/pressable"

import {
  DetailsOverlay,
  EntityIcon,
  entityIconClassName,
  UpgradeIcon,
} from "@/shared/ui"
import type { EntityIconSize } from "@/shared/ui"

import type { DailyRaidResourceVisual } from "../model/daily-raids.domain"
import { useMaterialDetailsSource } from "../model/material-details-context"
import { TodaysMaterialDetails } from "./material-details"

/** A resource's icon: an upgrade material's rarity-framed icon, or a unit's shard icon. Shared
 * between `pages/dailies`'s resource cards and the home Daily Raids widget's compact rows. `size`
 * is the style guide's icon role: `icon-2xl` on a card, `icon-lg` in a list row. */
export function ResourceIcon({
  size = "icon-2xl",
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

type ResourceIconSize = Extract<EntityIconSize, "icon-lg" | "icon-2xl">

/** `ResourceIcon` with its name available as a tooltip on hover/focus, since the icon alone
 * replaces the visible resource name in location-emphasis rendering. Given its `resourceId` inside a
 * `MaterialDetailsProvider`, a click or tap also opens the material's details (a popover on desktop,
 * a bottom sheet on a phone). */
export function ResourceIconWithTooltip({
  size,
  label,
  visual,
  resourceId,
}: {
  size?: ResourceIconSize
  label: string
  visual: DailyRaidResourceVisual | undefined
  resourceId?: string
}) {
  const source = useMaterialDetailsSource()
  const button = (
    <Pressable
      aria-label={label}
      className="shrink-0 rounded-sm border-0 bg-transparent p-0"
    >
      <ResourceIcon size={size} label={label} visual={visual} />
    </Pressable>
  )
  if (source && resourceId !== undefined) {
    return (
      <DetailsOverlay
        testId={`material-details-${resourceId}-overlay`}
        title={label}
        tooltip={label}
        trigger={button}
      >
        <TodaysMaterialDetails
          resourceId={resourceId}
          source={source}
          testId={`material-details-${resourceId}`}
        />
      </DetailsOverlay>
    )
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

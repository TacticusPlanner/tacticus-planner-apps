import type { ComponentProps } from "react"
import { useTranslation } from "react-i18next"
import { characterIcon } from "@workspace/game-catalog"
import type { UnitId } from "@workspace/game-domain"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { cn } from "@workspace/ui/lib/utils"

import type { LegendaryEventRosterUnit } from "@/entities/legendary-event"
import { EntityIcon } from "@/shared/ui"

import { TierTileDetailsBody } from "./tier-tile-details"
import { formatMultiplier, tierTileDetails } from "./tier-list.view-model"

/** One tile as the page renders it; untiered tiles carry the 1.0 multiplier, never an override. */
export interface TierTileView {
  unitId: string
  multiplier: number
  overridden: boolean
  owned: boolean | undefined
}

/** The tile's face: portrait, name and effective multiplier (with the override mark). Desktop lays
 *  them in a row; mobile stacks portrait and multiplier over the truncated name in a 44px+ cell. */
function TierTileButton({
  tile,
  name,
  muted,
  isMobile,
  className,
  ...props
}: ComponentProps<"button"> & {
  tile: TierTileView
  name: string
  muted: boolean
  isMobile: boolean
}) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const multiplier = (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs tabular-nums",
        tile.overridden ? "font-semibold text-primary" : "text-muted-foreground"
      )}
    >
      <span data-testid="tier-tile-multiplier">
        {formatMultiplier(tile.multiplier, i18n.language)}
      </span>
      {tile.overridden ? (
        <span data-testid="tier-tile-override" title={t("tierList.override")}>
          <span aria-hidden="true">*</span>
          <span className="sr-only">{t("tierList.override")}</span>
        </span>
      ) : null}
    </span>
  )
  return (
    <button
      aria-label={t(
        tile.overridden ? "tierList.tileLabelOverride" : "tierList.tileLabel",
        {
          name,
          multiplier: formatMultiplier(tile.multiplier, i18n.language),
        }
      )}
      className={cn(
        "rounded-lg border bg-card text-left transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none",
        isMobile
          ? "flex min-h-11 w-full min-w-0 flex-col items-center gap-0.5 p-1"
          : "flex min-w-0 items-center gap-2 py-1 pr-3 pl-1",
        className
      )}
      data-muted={muted}
      data-overridden={tile.overridden}
      data-owned={tile.owned === undefined ? "unknown" : tile.owned}
      data-testid="tier-list-tile"
      data-unit-id={tile.unitId}
      type="button"
      {...props}
    >
      <EntityIcon
        alt=""
        className={cn(
          "shrink-0 rounded-full",
          isMobile ? "size-10" : "size-9",
          muted && "opacity-50 grayscale"
        )}
        src={characterIcon(tile.unitId as UnitId)}
      />
      {isMobile ? (
        <>
          {multiplier}
          <span
            className="w-full truncate text-center text-xs"
            data-testid="tier-tile-name"
          >
            {name}
          </span>
        </>
      ) : (
        <span className="flex min-w-0 flex-col">
          <span
            className={cn(
              "truncate text-sm font-medium",
              muted && "text-muted-foreground"
            )}
            data-testid="tier-tile-name"
          >
            {name}
          </span>
          {multiplier}
        </span>
      )}
    </button>
  )
}

/** A tile that opens its details: a popover anchored to it on desktop; on mobile it hands the
 *  selection to the page, which shows the details in a bottom sheet. */
export function TierTile({
  tile,
  row,
  name,
  muted,
  isMobile,
  roster,
  onOpen,
}: {
  tile: TierTileView
  /** The tile's tier row, or null for an untiered tile. */
  row: { tier: string; multiplier: number } | null
  name: string
  muted: boolean
  isMobile: boolean
  roster: readonly LegendaryEventRosterUnit[] | undefined
  onOpen: () => void
}) {
  if (isMobile) {
    return (
      <TierTileButton
        isMobile
        muted={muted}
        name={name}
        onClick={onOpen}
        tile={tile}
      />
    )
  }
  return (
    <Popover
      onOpenChange={(open) => {
        if (open) onOpen()
      }}
    >
      <PopoverTrigger asChild>
        <TierTileButton
          isMobile={false}
          muted={muted}
          name={name}
          tile={tile}
        />
      </PopoverTrigger>
      <PopoverContent align="start" data-testid="tier-tile-details-popover">
        <TierTileDetailsBody
          details={tierTileDetails(tile, row, roster)}
          name={name}
        />
      </PopoverContent>
    </Popover>
  )
}

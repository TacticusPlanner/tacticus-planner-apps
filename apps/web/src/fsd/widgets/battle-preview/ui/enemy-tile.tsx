import { useTranslation } from "react-i18next"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@workspace/ui/components/sheet"

import { NpcLevelBadge, NpcPortrait } from "@/entities/npc"

import type { EnemyTileViewModel } from "../model/enemy-tile"
import { EnemyDetail } from "./enemy-detail"
import { useEnemyLabels } from "./enemy-label"

/**
 * One served enemy entry of a wave (design D5): portrait, localized name, a "×N" badge when the
 * entry spawns more than one, and its level. Activating it opens the enemy detail in a popover on
 * desktop and a bottom sheet on mobile; both return focus to the tile on close.
 */
export function EnemyTile({
  tile,
  isMobile,
}: {
  tile: EnemyTileViewModel
  isMobile: boolean
}) {
  const { t } = useTranslation("legendaryEvents")
  const { enemyName, tileLabel } = useEnemyLabels()
  const name = enemyName(tile)
  const trigger = (
    <button
      aria-label={tileLabel(tile)}
      className="flex min-h-11 w-full min-w-0 items-center gap-2 rounded-lg border bg-card p-2 text-left transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      data-level={tile.level}
      data-npc={tile.npcId}
      data-testid="battle-enemy-tile"
      type="button"
    >
      <NpcPortrait className="size-10" name={name} variationId={tile.npcId} />
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="flex min-w-0 items-baseline gap-1">
          <span className="truncate text-sm font-medium">{name}</span>
          {tile.count > 1 ? (
            <span
              className="shrink-0 text-sm font-semibold text-muted-foreground tabular-nums"
              data-testid="battle-enemy-count"
            >
              ×{tile.count}
            </span>
          ) : null}
        </span>
        {tile.row ? (
          <NpcLevelBadge row={tile.row} />
        ) : tile.level === "unknownLevel" ? (
          <span className="text-xs text-muted-foreground">
            {t("battles.enemy.levelUnknown")}
          </span>
        ) : null}
      </span>
    </button>
  )

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>{trigger}</SheetTrigger>
        <SheetContent data-testid="battle-enemy-sheet" side="bottom">
          <SheetHeader>
            <SheetTitle>{name}</SheetTitle>
            <SheetDescription className="sr-only">
              {t("battles.enemy.detailDescription")}
            </SheetDescription>
          </SheetHeader>
          <div className="overflow-y-auto px-4 pb-4">
            <EnemyDetail tile={tile} />
          </div>
        </SheetContent>
      </Sheet>
    )
  }
  return (
    <Popover>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        aria-label={name}
        className="w-80"
        data-testid="battle-enemy-popover"
      >
        <EnemyDetail tile={tile} />
      </PopoverContent>
    </Popover>
  )
}

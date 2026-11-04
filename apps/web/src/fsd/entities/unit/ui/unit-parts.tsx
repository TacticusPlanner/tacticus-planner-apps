import type { CSSProperties } from "react"
import { useTranslation } from "react-i18next"
import { EquipmentIcons, shardIcon } from "@workspace/game-catalog"
import { cn } from "@workspace/ui/lib/utils"

import { EntityIcon } from "@/shared/ui"

import type { UnitTileEquipment, UnownedUnitTileData } from "../model/types"
import { outlinedText, rarityColor } from "./unit-styles"

// The pieces a unit's Cards tile and its Roster row draw the same way.

/** An equipped item: its icon in a frame of its rarity colour, with the item level. */
export function EquipmentSlot({ item }: { item: UnitTileEquipment }) {
  const style: CSSProperties | undefined = item.rarity
    ? { borderColor: rarityColor(item.rarity) }
    : undefined

  return (
    <span
      className="relative h-[22px] overflow-hidden rounded border-2 bg-muted"
      style={style}
      data-testid="unit-tile-item"
    >
      <EntityIcon
        src={EquipmentIcons.icon(item.equipmentId)}
        fallback={EquipmentIcons.fallback}
        alt=""
        className="absolute inset-0 m-auto size-full object-contain"
      />
      <span
        className={cn(
          "absolute right-px bottom-0 text-xs leading-none font-bold text-overlay-foreground tabular-nums",
          outlinedText
        )}
      >
        {item.level}
      </span>
    </span>
  )
}

/**
 * An unowned unit's shard progress: have/need with a progressbar, the count alone without an unlock
 * cost, or the rarity it starts at when no shard data is known.
 */
export function UnownedDetails({ data }: { data: UnownedUnitTileData }) {
  const { t } = useTranslation(["common", "progression"])

  if (data.shards === undefined) {
    return data.rarity ? (
      <p
        className="pt-1 text-center text-xs text-muted-foreground"
        data-testid="unit-tile-starts"
      >
        {t("unitTile.startsAt", {
          rarity: t(`progression:rarities.${data.rarity}`),
        })}
      </p>
    ) : null
  }

  const { shards, unlockShards, mythicShards } = data
  const percent =
    unlockShards && unlockShards > 0
      ? Math.min(100, Math.round((shards / unlockShards) * 100))
      : undefined

  return (
    <div className="flex flex-col items-stretch gap-1 pt-1">
      <span className="flex items-center justify-center gap-1.5 text-xs tabular-nums">
        <span data-testid="unit-tile-shards">
          <b className="font-bold">{shards}</b>
          {unlockShards === undefined ? null : `/${unlockShards}`}
        </span>
        {mythicShards ? (
          <span
            className="inline-flex items-center gap-0.5"
            data-testid="unit-tile-mythic-shards"
          >
            <EntityIcon src={shardIcon("Mythic")} alt="" className="size-3" />
            {mythicShards}
          </span>
        ) : null}
      </span>
      {percent === undefined ? null : (
        <span
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={unlockShards}
          aria-valuenow={Math.min(shards, unlockShards!)}
          aria-label={t("unitTile.unlockProgress")}
          className="h-1.5 overflow-hidden rounded-full bg-muted"
        >
          <span
            className="block h-full rounded-full bg-progress"
            style={{ width: `${percent}%` }}
          />
        </span>
      )}
    </div>
  )
}

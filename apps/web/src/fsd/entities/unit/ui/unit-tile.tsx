import { useTranslation } from "react-i18next"
import {
  characterIcon,
  EquipmentIcons,
  mowIcon,
  progressionVisual,
  rankIcon,
  shardIcon,
} from "@workspace/game-catalog"
import { progressionRarity, type Rarity } from "@workspace/game-domain"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
import { cn } from "@workspace/ui/lib/utils"

import { EntityIcon } from "@/shared/ui"

import type {
  OwnedUnitTileData,
  UnitTileUnit,
  UnownedUnitTileData,
} from "../model/types"

const rarityRing: Record<Rarity, string> = {
  Common: "ring-[var(--rarity-common)]",
  Uncommon: "ring-[var(--rarity-uncommon)]",
  Rare: "ring-[var(--rarity-rare)]",
  Epic: "ring-[var(--rarity-epic)]",
  Legendary: "ring-[var(--rarity-legendary)]",
  Mythic: "ring-[var(--rarity-mythic)]",
}

/**
 * One unit of the player's collection: its portrait in a rarity-coloured frame plus the synced
 * progression indicators V1 Who You Own shows (stars, rank, XP level, ability levels, equipment,
 * shards). Unowned units render greyed out with only their shard progress. Presentational only -
 * it never fetches and is not interactive; its accessible name is the unit name, which desktop
 * also shows as a tooltip on hover or keyboard focus.
 */
export function UnitTile({
  unit,
  className,
  testId,
}: {
  unit: UnitTileUnit
  className?: string
  testId?: string
}) {
  const isMobile = useIsMobile()
  const { data } = unit
  const portrait =
    unit.kind === "character"
      ? characterIcon(unit.unitId)
      : mowIcon(unit.unitId)
  const frameRarity =
    data.state === "owned" ? progressionRarity(data.progression) : data.rarity

  const tile = (
    <div
      role="group"
      aria-label={unit.name}
      data-testid={testId}
      data-state={data.state}
      tabIndex={isMobile ? undefined : 0}
      className={cn(
        "flex w-20 flex-col items-center gap-1 rounded-md p-1 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-24",
        className
      )}
    >
      <div
        className={cn(
          "relative size-14 rounded-full ring-2 ring-offset-2 ring-offset-background sm:size-16",
          frameRarity ? rarityRing[frameRarity] : "ring-border",
          data.state === "unowned" && "opacity-60 grayscale"
        )}
      >
        <EntityIcon src={portrait} alt="" className="size-full rounded-full" />
        {data.state === "owned" && data.rank ? (
          <EntityIcon
            src={rankIcon(data.rank)}
            alt=""
            className="absolute -top-1 -left-1 size-6 drop-shadow"
          />
        ) : null}
        {data.state === "owned" && data.xpLevel !== undefined ? (
          <span
            data-testid="unit-tile-xp-level"
            className="absolute -right-1 -bottom-1 rounded-full bg-background px-1 text-[10px] leading-4 font-semibold tabular-nums ring-1 ring-border"
          >
            {data.xpLevel}
          </span>
        ) : null}
      </div>
      {data.state === "owned" ? (
        <OwnedDetails kind={unit.kind} data={data} />
      ) : (
        <UnownedDetails data={data} />
      )}
    </div>
  )

  if (isMobile) return tile

  return (
    <Tooltip>
      <TooltipTrigger asChild>{tile}</TooltipTrigger>
      <TooltipContent>{unit.name}</TooltipContent>
    </Tooltip>
  )
}

function OwnedDetails({
  kind,
  data,
}: {
  kind: UnitTileUnit["kind"]
  data: OwnedUnitTileData
}) {
  const { t } = useTranslation("common")
  const visual = progressionVisual(data.progression)
  const [first, second] = data.abilityLevels

  return (
    <>
      <span
        className="flex h-3 items-center gap-px"
        data-testid="unit-tile-stars"
      >
        {visual.kind === "stars" ? (
          Array.from({ length: visual.count }, (_, index) => (
            <EntityIcon
              key={index}
              src={visual.icon}
              alt=""
              className="size-3"
            />
          ))
        ) : visual.kind === "wings" ? (
          <EntityIcon src={visual.icon} alt="" className="h-3 w-auto" />
        ) : null}
      </span>
      <span
        className="flex gap-1 tabular-nums"
        data-testid="unit-tile-abilities"
        aria-label={t(
          kind === "character"
            ? "unitTile.characterAbilities"
            : "unitTile.mowAbilities",
          { first, second }
        )}
      >
        <span className="rounded bg-muted px-1">{first}</span>
        <span className="rounded bg-muted px-1">{second}</span>
      </span>
      {data.equipment && data.equipment.length > 0 ? (
        <span className="flex gap-0.5" data-testid="unit-tile-equipment">
          {data.equipment.map((item, index) => (
            <span key={index} className="relative size-5">
              <EntityIcon
                src={EquipmentIcons.icon(item.equipmentId)}
                fallback={EquipmentIcons.fallback}
                alt=""
                className="size-full"
              />
              {item.rarity ? (
                <EntityIcon
                  src={EquipmentIcons.frame(item.rarity)}
                  alt=""
                  className="absolute inset-0 size-full"
                />
              ) : null}
              <span className="absolute -right-1 -bottom-1 text-[9px] leading-none font-semibold tabular-nums">
                {item.level}
              </span>
            </span>
          ))}
        </span>
      ) : null}
      <ShardCounts shards={data.shards} mythicShards={data.mythicShards} />
    </>
  )
}

function UnownedDetails({ data }: { data: UnownedUnitTileData }) {
  if (data.shards === undefined) return null
  return (
    <ShardCounts
      shards={data.shards}
      unlockShards={data.unlockShards}
      mythicShards={data.mythicShards}
    />
  )
}

function ShardCounts({
  shards,
  unlockShards,
  mythicShards,
}: {
  shards: number
  unlockShards?: number
  mythicShards?: number
}) {
  const { t } = useTranslation("common")

  return (
    <span className="flex items-center gap-1 tabular-nums">
      <span
        className="inline-flex items-center gap-0.5"
        data-testid="unit-tile-shards"
        aria-label={
          unlockShards === undefined
            ? t("unitTile.shards", { count: shards })
            : t("unitTile.shardsToUnlock", {
                count: shards,
                required: unlockShards,
              })
        }
      >
        <EntityIcon src={shardIcon("Regular")} alt="" className="size-3" />
        {unlockShards === undefined ? shards : `${shards}/${unlockShards}`}
      </span>
      {mythicShards ? (
        <span
          className="inline-flex items-center gap-0.5"
          data-testid="unit-tile-mythic-shards"
          aria-label={t("unitTile.mythicShards", { count: mythicShards })}
        >
          <EntityIcon src={shardIcon("Mythic")} alt="" className="size-3" />
          {mythicShards}
        </span>
      ) : null}
    </span>
  )
}

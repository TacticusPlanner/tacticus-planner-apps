import type { CSSProperties } from "react"
import { Lock } from "lucide-react"
import { useTranslation } from "react-i18next"
import {
  characterIcon,
  EquipmentIcons,
  mowIcon,
  progressionVisual,
  rankIcon,
  shardIcon,
} from "@workspace/game-catalog"
import {
  progressionRarity,
  progressionStarsIndex,
  type Progression,
  type Rarity,
} from "@workspace/game-domain"
import { cn } from "@workspace/ui/lib/utils"

import { EntityIcon } from "@/shared/ui"

import type {
  OwnedUnitTileData,
  UnitKind,
  UnitTileEquipment,
  UnitTileUnit,
  UnownedUnitTileData,
} from "../model/types"

const rarityColor = (rarity: Rarity) => `var(--rarity-${rarity.toLowerCase()})`

// Black outline so a count stays readable over the bright shard crystal and portrait art.
const outlinedText =
  "[text-shadow:-1px_-1px_0_#000,1px_-1px_0_#000,-1px_1px_0_#000,1px_1px_0_#000,0_1px_3px_rgb(0_0_0/0.8)]"

/**
 * One unit of the player's collection as a game-style card: a round portrait ringed in its rarity
 * colour with stars, rank and shards overlaid, then its name, a row of number boxes (XP level and
 * ability levels) and its equipment. Unowned units render greyed out with a lock and their unlock
 * progress, or the rarity they start at when no shard data is known. Every variant reserves the
 * same rows, so tiles in a grid share one height. Presentational only - it never fetches and is not
 * interactive (Stage 4 makes it open the unit's Library page). It is a group whose accessible name
 * spells the progression out; every image inside is decorative.
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
  const label = useUnitTileLabel(unit)
  const { data } = unit
  const portrait =
    unit.kind === "character"
      ? characterIcon(unit.unitId)
      : mowIcon(unit.unitId)
  const owned = data.state === "owned" ? data : undefined

  return (
    <div
      role="group"
      aria-label={label}
      title={unit.name}
      data-testid={testId}
      data-state={data.state}
      className={cn(
        "flex min-w-0 flex-col items-center px-0.5 pt-2.5 pb-1",
        className
      )}
    >
      <div className="relative aspect-square w-full max-w-18">
        <div
          className={cn(
            "size-full overflow-hidden rounded-full bg-portrait",
            owned
              ? "border-3"
              : "border-2 border-dashed border-border opacity-60 grayscale"
          )}
          style={
            owned
              ? {
                  borderColor: rarityColor(
                    progressionRarity(owned.progression)
                  ),
                }
              : undefined
          }
          data-testid="unit-tile-portrait"
          data-rarity={owned ? progressionRarity(owned.progression) : undefined}
        >
          <EntityIcon
            src={portrait}
            alt=""
            className="size-full object-cover"
          />
        </div>
        {owned ? (
          <PortraitOverlays kind={unit.kind} data={owned} />
        ) : (
          <span className="absolute -top-1 -right-1 grid size-5.5 place-items-center rounded-full bg-overlay text-overlay-foreground">
            <Lock aria-hidden="true" className="size-3" />
          </span>
        )}
      </div>
      <span
        className={cn(
          "mt-1.5 w-full truncate text-center text-xs leading-[15px] font-semibold",
          !owned && "text-muted-foreground"
        )}
      >
        {unit.name}
      </span>
      <div className="mt-1 h-11 w-full">
        {owned ? (
          <OwnedDetails kind={unit.kind} data={owned} />
        ) : (
          <UnownedDetails data={data as UnownedUnitTileData} />
        )}
      </div>
    </div>
  )
}

function PortraitOverlays({
  kind,
  data,
}: {
  kind: UnitKind
  data: OwnedUnitTileData
}) {
  const visual = progressionVisual(data.progression)

  return (
    <>
      {visual.kind === "none" ? null : (
        <span
          className="absolute -top-2.5 left-1/2 flex h-4.5 w-max -translate-x-1/2 items-center gap-px rounded-[5px] bg-overlay px-[3px]"
          data-testid="unit-tile-stars"
          data-count={visual.kind === "stars" ? visual.count : undefined}
        >
          {visual.kind === "stars" ? (
            Array.from({ length: visual.count }, (_, index) => (
              <EntityIcon
                key={index}
                src={visual.icon}
                alt=""
                className="size-[13px]"
              />
            ))
          ) : (
            <EntityIcon src={visual.icon} alt="" className="h-4 w-auto" />
          )}
        </span>
      )}
      {kind === "character" && data.rank ? (
        <span
          className="absolute -bottom-1.5 -left-1.5 h-[25px] w-[26px] drop-shadow-[0_1px_2px_rgb(0_0_0/0.7)]"
          data-testid="unit-tile-rank"
        >
          <EntityIcon src={rankIcon(data.rank)} alt="" className="size-full" />
        </span>
      ) : null}
      {usesMythicShards(data.progression) ? (
        <ShardCrystal
          kind="Mythic"
          count={data.mythicShards}
          testId="unit-tile-mythic-shards"
        />
      ) : (
        <ShardCrystal
          kind="Regular"
          count={data.shards}
          testId="unit-tile-shards"
        />
      )}
    </>
  )
}

/**
 * From the first blue star on, every further ascension costs mythic shards, so an owned unit's tile
 * shows only the shard count that still matters: regular below a blue star, mythic from it.
 */
function usesMythicShards(progression: Progression): boolean {
  return progressionStarsIndex(progression) >= firstBlueStarIndex
}
const firstBlueStarIndex = 11

function ShardCrystal({
  kind,
  count,
  testId,
}: {
  kind: "Regular" | "Mythic"
  count: number
  testId: string
}) {
  return (
    <span
      className="absolute -right-1.5 -bottom-1.5 grid h-5 w-[22px] place-items-center"
      data-testid={testId}
    >
      <EntityIcon
        src={shardIcon(kind)}
        alt=""
        className="absolute inset-0 size-full object-contain drop-shadow-[0_1px_2px_rgb(0_0_0/0.6)]"
      />
      <span
        className={cn(
          "relative text-[10px] leading-none font-bold text-overlay-foreground tabular-nums",
          outlinedText
        )}
      >
        {count}
      </span>
    </span>
  )
}

function OwnedDetails({
  kind,
  data,
}: {
  kind: UnitKind
  data: OwnedUnitTileData
}) {
  const [first, second] = data.abilityLevels
  const slots: (UnitTileEquipment | undefined)[] = [0, 1, 2].map(
    (index) => data.equipment?.[index]
  )

  return (
    <div className="flex flex-col gap-0.5">
      <div
        className="grid grid-cols-3 gap-0.5 text-xs tabular-nums"
        data-testid="unit-tile-numbers"
      >
        {/* As in game: abilities on the sides, the XP level (characters only) in the middle. */}
        <span className="grid h-5 place-items-center rounded border font-semibold">
          {first}
        </span>
        {kind === "character" ? (
          <span
            className="grid h-5 place-items-center rounded bg-overlay font-bold text-overlay-foreground"
            data-testid="unit-tile-xp-level"
          >
            {data.xpLevel}
          </span>
        ) : (
          <span />
        )}
        <span className="grid h-5 place-items-center rounded border font-semibold">
          {second}
        </span>
      </div>
      {kind === "character" ? (
        <div
          className="grid grid-cols-3 gap-0.5"
          data-testid="unit-tile-equipment"
        >
          {slots.map((item, index) =>
            item ? (
              <EquipmentSlot key={index} item={item} />
            ) : (
              <span
                key={index}
                className="h-[22px] rounded border-2 border-dashed"
                data-testid="unit-tile-empty-slot"
              />
            )
          )}
        </div>
      ) : null}
    </div>
  )
}

function EquipmentSlot({ item }: { item: UnitTileEquipment }) {
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

function UnownedDetails({ data }: { data: UnownedUnitTileData }) {
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

/** "Titus, Legendary, Red Four Stars, Gold I, level 45, active ability level 40, ...". */
function useUnitTileLabel(unit: UnitTileUnit): string {
  const { t } = useTranslation(["common", "progression"])
  const { data } = unit
  const parts = [unit.name]

  if (data.state === "owned") {
    parts.push(...progressionParts(data.progression, t))
    if (data.rank) parts.push(t(`progression:ranks.${data.rank}`))
    if (data.xpLevel !== undefined) {
      parts.push(t("unitTile.level", { level: data.xpLevel }))
    }
    const [first, second] = data.abilityLevels
    parts.push(
      t(
        unit.kind === "character"
          ? "unitTile.characterAbilities"
          : "unitTile.mowAbilities",
        { first, second }
      )
    )
    parts.push(
      usesMythicShards(data.progression)
        ? t("unitTile.mythicShards", { count: data.mythicShards })
        : t("unitTile.shards", { count: data.shards })
    )
    return parts.join(", ")
  }

  parts.push(t("unitTile.notOwned"))
  if (data.shards === undefined) {
    if (data.rarity) {
      parts.push(
        t("unitTile.startsAt", {
          rarity: t(`progression:rarities.${data.rarity}`),
        })
      )
    }
  } else {
    parts.push(
      data.unlockShards === undefined
        ? t("unitTile.shards", { count: data.shards })
        : t("unitTile.shardsToUnlock", {
            count: data.shards,
            required: data.unlockShards,
          })
    )
    if (data.mythicShards) {
      parts.push(t("unitTile.mythicShards", { count: data.mythicShards }))
    }
  }
  return parts.join(", ")
}

type StarsKey = Progression extends `${string}:${infer Stars}` ? Stars : never

function progressionParts(
  progression: Progression,
  t: ReturnType<typeof useTranslation<["common", "progression"]>>["t"]
): string[] {
  const [rarity, stars] = progression.split(":") as [Rarity, StarsKey]
  const parts = [t(`progression:rarities.${rarity}`)]
  if (stars !== "None") parts.push(t(`progression:stars.${stars}`))
  return parts
}

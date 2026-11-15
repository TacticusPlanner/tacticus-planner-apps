import { Link, type To } from "react-router"
import {
  characterIcon,
  factionIcon,
  lockIcon,
  mowIcon,
  progressionVisual,
  rankIcon,
  shardIcon,
} from "@workspace/game-catalog"
import { progressionRarity } from "@workspace/game-domain"
import { cn } from "@workspace/ui/lib/utils"

import { EntityIcon } from "@/shared/ui"

import type {
  OwnedUnitTileData,
  UnitFaction,
  UnitKind,
  UnitTileEquipment,
  UnitTileUnit,
  UnownedUnitTileData,
} from "../model/types"
import { EquipmentSlot, UnownedDetails } from "./unit-parts"
import { outlinedText, rarityColor } from "./unit-styles"
import { usesMythicShards, useUnitTileLabel } from "./unit-tile-label"

/**
 * One unit of the player's collection as a game-style card: a round portrait ringed in its rarity
 * colour with stars, rank and shards overlaid, then its name, a row of number boxes (XP level and
 * ability levels) and its equipment. Unowned units render greyed out with a lock and their unlock
 * progress, or the rarity they start at when no shard data is known. Every variant reserves the
 * same rows, so tiles in a grid share one height. Presentational only - it never fetches. Given a
 * `link` the whole tile is that link (Collection opens the unit's Library page); otherwise it is a
 * static group. Either way its accessible name spells the progression out and every image inside is
 * decorative.
 */
export function UnitTile({
  unit,
  link,
  faction,
  className,
  testId,
}: {
  unit: UnitTileUnit
  /** Makes the tile a link; `state` goes into router history state, never the URL. */
  link?: { to: To; state?: unknown }
  /** Shows the faction (icon, and name in the accessible name) when no faction group does. */
  faction?: UnitFaction
  className?: string
  testId?: string
}) {
  const label = useUnitTileLabel(unit, faction)
  const { data } = unit
  const portrait =
    unit.kind === "character"
      ? characterIcon(unit.unitId)
      : mowIcon(unit.unitId)
  const owned = data.state === "owned" ? data : undefined

  const content = (
    <>
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
        {faction ? (
          <span
            className="absolute top-1/2 -left-1 grid size-5.5 -translate-y-1/2 place-items-center rounded-full bg-overlay"
            data-testid="unit-tile-faction"
            data-faction={faction.id}
          >
            <EntityIcon
              src={factionIcon(faction.id)}
              alt=""
              className="size-4"
            />
          </span>
        ) : null}
        {owned ? (
          <PortraitOverlays kind={unit.kind} data={owned} />
        ) : (
          <span className="absolute -top-1 -right-1 grid size-5.5 place-items-center rounded-full bg-overlay text-overlay-foreground">
            <EntityIcon src={lockIcon()} alt="" className="size-3.5" />
          </span>
        )}
      </div>
      <span
        className={cn(
          "mt-1.5 w-full truncate text-center text-xs/4 font-semibold",
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
    </>
  )
  const rootProps = {
    "aria-label": label,
    title: unit.name,
    "data-testid": testId,
    "data-state": data.state,
  }
  const layout = "flex min-w-0 flex-col items-center px-0.5 pt-2.5 pb-1"

  return link ? (
    <Link
      to={link.to}
      state={link.state}
      {...rootProps}
      className={cn(
        layout,
        "rounded-lg transition-colors hover:bg-accent/10 focus-visible:outline-2 focus-visible:outline-primary",
        className
      )}
    >
      {content}
    </Link>
  ) : (
    <div role="group" {...rootProps} className={cn(layout, className)}>
      {content}
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
          className="absolute -top-2.5 left-1/2 flex h-4.5 w-max -translate-x-1/2 items-center gap-px rounded-sm bg-overlay px-0.75"
          data-testid="unit-tile-stars"
          data-count={visual.kind === "stars" ? visual.count : undefined}
        >
          {visual.kind === "stars" ? (
            Array.from({ length: visual.count }, (_, index) => (
              <EntityIcon
                key={index}
                src={visual.icon}
                alt=""
                className="size-3.5"
              />
            ))
          ) : (
            <EntityIcon
              src={visual.icon}
              alt=""
              className="h-4 w-auto"
              width={512}
              height={164}
            />
          )}
        </span>
      )}
      {kind === "character" && data.rank ? (
        <span
          className="absolute -bottom-1.5 -left-1.5 size-6 drop-shadow-[0_1px_2px_rgb(0_0_0/0.7)]"
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
      className="absolute -right-1.5 -bottom-1.5 grid h-5 w-6 place-items-center"
      data-testid={testId}
    >
      <EntityIcon
        src={shardIcon(kind)}
        alt=""
        className="absolute inset-0 size-full object-contain drop-shadow-[0_1px_2px_rgb(0_0_0/0.6)]"
      />
      <span
        className={cn(
          "relative text-2xs leading-none font-bold text-overlay-foreground tabular-nums",
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
        <span className="grid h-5 place-items-center rounded-sm border font-semibold">
          {first}
        </span>
        {kind === "character" ? (
          <span
            className="grid h-5 place-items-center rounded-sm bg-overlay font-bold text-overlay-foreground"
            data-testid="unit-tile-xp-level"
          >
            {data.xpLevel}
          </span>
        ) : (
          <span />
        )}
        <span className="grid h-5 place-items-center rounded-sm border font-semibold">
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
                className="h-6 rounded-sm border-2 border-dashed"
                data-testid="unit-tile-empty-slot"
              />
            )
          )}
        </div>
      ) : null}
    </div>
  )
}

import { useTranslation } from "react-i18next"
import {
  characterIcon,
  progressionVisual,
  rankIcon,
  traitIcon,
} from "@workspace/game-catalog"
import { progressionRarity, type UnitId } from "@workspace/game-domain"
import { cn } from "@workspace/ui/lib/utils"

import { EntityIcon } from "@/shared/ui"
import { useUnitName } from "@/shared/unit-name"

import type { EventUnitChipData } from "../lib/event-unit-chip-data"
import { rankTone } from "../lib/rank-tone"

/**
 * One unit on the Event board, a team card or the team picker: its portrait ringed in its rarity colour, its rank icon, and its
 * active and passive ability levels, on a background in its rank colour. `showStars` adds its
 * ascension stars (saved teams, where the chip carries what a shared screenshot needs). A unit
 * the player does not own is greyed out and reads "Locked"; with no roster only the portrait
 * shows. A Healer or Mechanic shows its trait icon at the end when the chip sits in a container
 * (`@container`) wide enough for it, as on the Event board's wider columns. The accessible name
 * spells it all out.
 */
export function EventUnitChip({
  unit,
  showStars = false,
  className,
}: {
  unit: EventUnitChipData
  showStars?: boolean
  className?: string
}) {
  const { t } = useTranslation([
    "legendaryEvents",
    "common",
    "progression",
    "traits",
  ])
  const unitName = useUnitName()
  const name = unitName("Character", unit.unitId)
  const owned = unit.owned === true
  const visual =
    showStars && unit.progression ? progressionVisual(unit.progression) : null
  const traitLabels = (unit.supportTraits ?? []).map((trait) =>
    t(`traits:${trait}`, { defaultValue: trait })
  )
  const baseLabel = owned
    ? [
        name,
        unit.progression
          ? t(`progression:rarities.${progressionRarity(unit.progression)}`)
          : undefined,
        unit.rank ? t(`progression:ranks.${unit.rank}`) : undefined,
        t("common:unitTile.characterAbilities", {
          first: unit.activeLevel,
          second: unit.passiveLevel,
        }),
      ]
        .filter(Boolean)
        .join(", ")
    : unit.owned === false
      ? `${name}, ${t("common:unitTile.notOwned")}`
      : name
  const label = [baseLabel, ...traitLabels].join(", ")
  return (
    <span
      aria-label={label}
      className={cn(
        "flex h-9 min-w-0 items-center gap-1 rounded-md border border-transparent px-1 text-foreground",
        unit.owned === false && "bg-muted/40 text-muted-foreground",
        className
      )}
      data-owned={
        unit.owned === undefined ? undefined : owned ? "true" : "false"
      }
      data-rank={unit.rank}
      data-testid="event-board-unit"
      data-unit-id={unit.unitId}
      role="img"
      style={owned ? rankTone(unit.rank) : undefined}
      title={label}
    >
      <span className="relative shrink-0">
        <span
          className={cn(
            "block size-7 overflow-hidden rounded-full border-2 bg-portrait",
            !owned && "border-border",
            unit.owned === false && "opacity-60 grayscale"
          )}
          style={
            owned && unit.progression
              ? {
                  borderColor: `var(--rarity-${progressionRarity(unit.progression).toLowerCase()})`,
                }
              : undefined
          }
        >
          <EntityIcon
            alt=""
            className="size-full object-cover"
            src={characterIcon(unit.unitId as UnitId)}
          />
        </span>
        {visual && visual.kind !== "none" ? (
          <span
            className="absolute -top-1.5 left-1/2 flex h-3 w-max -translate-x-1/2 items-center rounded-sm bg-overlay px-px"
            data-testid="event-board-unit-stars"
          >
            {visual.kind === "stars" ? (
              Array.from({ length: visual.count }, (_, index) => (
                <EntityIcon
                  alt=""
                  className="size-2.5"
                  key={index}
                  src={visual.icon}
                />
              ))
            ) : (
              <EntityIcon
                alt=""
                className="h-2.5 w-auto"
                height={164}
                src={visual.icon}
                width={512}
              />
            )}
          </span>
        ) : null}
      </span>
      {owned && unit.rank ? (
        <EntityIcon
          alt=""
          className="size-5 shrink-0"
          src={rankIcon(unit.rank)}
        />
      ) : null}
      {owned ? (
        <span
          aria-hidden="true"
          className="flex flex-col text-xs leading-3 font-semibold tabular-nums"
        >
          <span>A{unit.activeLevel}</span>
          <span>P{unit.passiveLevel}</span>
        </span>
      ) : unit.owned === false ? (
        <span aria-hidden="true" className="truncate text-xs">
          {t("legendaryEvents:eventBoard.locked")}
        </span>
      ) : null}
      {unit.supportTraits?.map((trait) => (
        <EntityIcon
          alt=""
          className="ml-auto hidden size-4 shrink-0 @[7.5rem]:block"
          data-testid="event-board-unit-trait"
          data-trait={trait}
          key={trait}
          src={traitIcon(trait)}
        />
      ))}
    </span>
  )
}

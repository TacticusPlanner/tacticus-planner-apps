import { useTranslation } from "react-i18next"
import { progressionVisual, rankIcon } from "@workspace/game-catalog"
import { progressionRarity } from "@workspace/game-domain"

import { EntityIcon } from "@/shared/ui"

import { RarityBadge } from "./rarity-badge"
import type { EventUnitChipData as UnitChipData } from "../lib/event-unit-chip-data"

/**
 * A unit's details, shared by the chip's hover/focus tooltip and its touch long-press panel: the
 * long name, then for an owned unit its rarity (badge, name, stars or wings), rank and ability
 * levels; "Not owned" for a locked unit; the name alone without a roster.
 */
export function EventUnitChipDetails({
  unit,
  longName,
}: {
  unit: UnitChipData
  longName: string
}) {
  const { t } = useTranslation(["legendaryEvents", "progression"])
  const rarity = unit.progression ? progressionRarity(unit.progression) : null
  const visual = unit.progression ? progressionVisual(unit.progression) : null
  // The stars or wings as words ("Red Four Stars"), for screen readers: the art is decorative.
  const stars = unit.progression?.split(":")[1]
  return (
    <span
      className="flex max-w-60 flex-col items-start gap-1 text-left text-xs"
      data-testid="unit-chip-details"
    >
      <span className="text-sm font-semibold">{longName}</span>
      {unit.owned === false ? (
        <span>{t("legendaryEvents:unitChip.notOwned")}</span>
      ) : null}
      {unit.owned && rarity ? (
        <span className="flex items-center gap-1.5">
          <RarityBadge rarity={rarity} />
          <span>{t(`progression:rarities.${rarity}`)}</span>
          {stars && visual && visual.kind !== "none" ? (
            <span className="sr-only">
              {t(`progression:stars.${stars}` as never, {
                defaultValue: stars,
              })}
            </span>
          ) : null}
          {visual && visual.kind === "stars" ? (
            <span className="flex items-center">
              {Array.from({ length: visual.count }, (_, index) => (
                <EntityIcon
                  alt=""
                  className="size-3"
                  key={index}
                  src={visual.icon}
                />
              ))}
            </span>
          ) : null}
          {visual && visual.kind === "wings" ? (
            <EntityIcon
              alt=""
              className="h-3 w-auto"
              height={164}
              src={visual.icon}
              width={512}
            />
          ) : null}
        </span>
      ) : null}
      {unit.owned && unit.rank ? (
        <span className="flex items-center gap-1.5">
          <EntityIcon alt="" className="size-5" src={rankIcon(unit.rank)} />
          <span>{t(`progression:ranks.${unit.rank}`)}</span>
        </span>
      ) : null}
      {unit.owned ? (
        <span className="tabular-nums">
          {t("legendaryEvents:unitChip.abilities", {
            active: unit.activeLevel,
            passive: unit.passiveLevel,
          })}
        </span>
      ) : null}
    </span>
  )
}

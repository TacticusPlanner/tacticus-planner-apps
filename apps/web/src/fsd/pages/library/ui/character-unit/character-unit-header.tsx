import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { characterIcon } from "@workspace/game-catalog"
import {
  lastRank,
  maxRankForProgression,
  progressionOrder,
  progressionRarity,
  rankIndex,
  rankOrder,
  type Progression,
  type Rank,
  type UnitId,
} from "@workspace/game-domain"
import { ProgressionSelect, RankSelect } from "@/shared/ui"

import { UnitHeader, type ValuesMode } from "../unit/unit-header"
import type { ShownValues, UnitOwnership } from "./character-unit.view-model"

export type { ValuesMode }

/** The character's unit header: the shared `UnitHeader` with rarity, stars and rank as Custom values. */
export function CharacterUnitHeader({
  unitId,
  name,
  factionId,
  alliance,
  ownership,
  signedIn,
  baseValues,
  shown,
  mode,
  onModeChange,
  onCustomChange,
  yourUnitLine,
  power,
  shards,
  isMobile,
}: {
  unitId: UnitId
  name: string
  factionId: string
  alliance: string
  ownership: UnitOwnership
  signedIn: boolean
  /** The player's values (owned) or the starting values (otherwise). */
  baseValues: ShownValues
  shown: ShownValues
  mode: ValuesMode
  onModeChange: (mode: ValuesMode) => void
  onCustomChange: (values: ShownValues) => void
  /** "Your unit: …" details, for an owned unit. */
  yourUnitLine?: string
  /** The unit's power at the shown values, in the values area. */
  power: ReactNode
  /** Shard progress towards unlocking, for a unit the player doesn't own. */
  shards?: { owned: number; needed: number }
  isMobile: boolean
}) {
  const { t } = useTranslation(["library", "factions", "progression"])
  const rarity = progressionRarity(shown.progression)
  const baseRarity = progressionRarity(baseValues.progression)
  const stars = (value: Progression) =>
    t(`progression:stars.${value.slice(value.indexOf(":") + 1)}`, {
      defaultValue: value,
    })
  const describe = (values: ShownValues) => ({
    rarity: t(`progression:rarities.${progressionRarity(values.progression)}`, {
      defaultValue: progressionRarity(values.progression),
    }),
    stars: stars(values.progression),
    rank: t(`progression:ranks.${values.rank}`, { defaultValue: values.rank }),
  })
  const rankOptions = rankOrder.filter(
    (rank) =>
      rankIndex(rank) <= rankIndex(lastRank) &&
      rankIndex(rank) <= rankIndex(maxRankForProgression(shown.progression))
  )
  const setProgression = (progression: Progression) => {
    const maxRank = maxRankForProgression(progression)
    onCustomChange({
      progression,
      rank: rankIndex(shown.rank) > rankIndex(maxRank) ? maxRank : shown.rank,
    })
  }

  return (
    <UnitHeader
      portraitSrc={characterIcon(unitId) ?? ""}
      portraitRarity={ownership === "notOwned" ? baseRarity : rarity}
      name={name}
      factionId={factionId}
      kindLine={alliance}
      ownership={ownership}
      signedIn={signedIn}
      yourUnit={
        yourUnitLine
          ? { label: t("characterUnit.header.yourUnit"), line: yourUnitLine }
          : undefined
      }
      notUnlockedText={t(
        "characterUnit.header.notUnlocked",
        describe(baseValues)
      )}
      showingText={t("characterUnit.header.showing", describe(baseValues))}
      shards={shards}
      mode={mode}
      onModeChange={onModeChange}
      power={power}
      isMobile={isMobile}
      customControls={
        <>
          <div className="w-56">
            <ProgressionSelect
              label={t("unit.values.stars")}
              value={shown.progression}
              options={progressionOrder}
              onChange={setProgression}
            />
          </div>
          <div className="w-40">
            <RankSelect
              label={t("unit.values.rank")}
              value={shown.rank}
              options={rankOptions}
              onChange={(rank: Rank) => onCustomChange({ ...shown, rank })}
            />
          </div>
        </>
      }
    />
  )
}

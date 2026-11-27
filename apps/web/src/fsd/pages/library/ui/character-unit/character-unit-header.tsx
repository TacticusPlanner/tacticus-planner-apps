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
} from "@workspace/game-domain"
import type { Progression, Rank, UnitId } from "@workspace/game-domain"
import { ProgressionSelect, ProgressionSummary, RankSelect } from "@/shared/ui"

import { UnitHeader } from "../unit/unit-header"
import type { ValuesMode } from "../unit/unit-header"
import type {
  ShownValues,
  UnitOwnership,
} from "../../model/character-unit/character-unit.view-model"
import { hasNode } from "@/shared/lib"

export type { ValuesMode }

/** The character's unit header: the shared `UnitHeader` with rarity, stars and rank as Custom values. */
export function CharacterUnitHeader({
  unitId,
  name,
  factionId,
  alliance,
  allianceId,
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
  action,
  isMobile,
}: {
  unitId: UnitId
  name: string
  factionId: string
  alliance: string
  allianceId: string
  ownership: UnitOwnership
  signedIn: boolean
  /** The player's values (owned) or the starting values (otherwise). */
  baseValues: ShownValues
  shown: ShownValues
  mode: ValuesMode
  onModeChange: (mode: ValuesMode) => void
  onCustomChange: (values: ShownValues) => void
  /** "Your unit: …" details, for an owned unit. */
  yourUnitLine?: ReactNode
  /** The unit's power at the shown values, in the values area. */
  power: ReactNode
  /** Shard progress towards unlocking, for a unit the player doesn't own. */
  shards?: { owned: number; needed: number }
  /** The unit's Create goal, passed through to the header. */
  action?: ReactNode
  isMobile: boolean
}) {
  const { t } = useTranslation(["library", "factions", "progression"])
  const rarity = progressionRarity(shown.progression)
  const baseRarity = progressionRarity(baseValues.progression)
  const startingValues = (label: string, details: readonly string[]) => (
    <>
      {label}{" "}
      <ProgressionSummary
        progression={baseValues.progression}
        rank={baseValues.rank}
        details={details}
      />
    </>
  )
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
      allianceId={allianceId}
      kindLine={alliance}
      ownership={ownership}
      signedIn={signedIn}
      yourUnit={
        hasNode(yourUnitLine)
          ? { label: t("characterUnit.header.yourUnit"), line: yourUnitLine }
          : undefined
      }
      notUnlockedText={startingValues(
        t("characterUnit.header.notUnlocked"),
        []
      )}
      showingText={startingValues(t("characterUnit.header.showing"), [
        t("characterUnit.header.abilitiesStart"),
      ])}
      shards={shards}
      mode={mode}
      onModeChange={onModeChange}
      power={power}
      action={action}
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

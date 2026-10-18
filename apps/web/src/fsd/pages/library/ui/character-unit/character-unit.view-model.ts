import {
  lastRank,
  rankIndex,
  rarityRank,
  rankOrder,
  startingProgression,
  type Progression,
  type Rank,
} from "@workspace/game-domain"
import type {
  CharacterStorageModel,
  EquipmentStorageModel,
} from "@workspace/game-catalog"
import type { PlayerDataChunkDto } from "@workspace/player-data"

import type { ReadState } from "@/shared/lib"
import {
  characterPowerAt,
  characterStatsAt,
  type CharacterPowerValues,
  type UnitPowerContext,
} from "@/shared/unit-power"

import { powerFigure, type PowerFigure } from "../unit/unit-power.model"

export type PlayerCharacter = PlayerDataChunkDto<"characters">[number]

/** The rarity/stars step and rank the page's stats are shown at. */
export type ShownValues = { progression: Progression; rank: Rank }

export { unitOwnership, type UnitOwnership } from "../unit/unit-ownership"

/** Where a unit nobody owns starts: its starting rarity's first star step, Stone I. */
export function startingValues(character: CharacterStorageModel): ShownValues {
  return {
    progression: startingProgression(character.initialRarity),
    rank: "Stone1",
  }
}

export function playerValues(player: PlayerCharacter): ShownValues {
  return { progression: player.progressionIndex, rank: player.rank }
}

type UnitStats = { health: number; damage: number; armour: number }

/** Every rank of the game's ladder, Stone I to the highest, for Stats by rank. */
export const ladderRanks: readonly Rank[] = rankOrder.filter(
  (rank) => rankIndex(rank) <= rankIndex(lastRank)
)

/**
 * What the page's power and stats are computed at (design D6): the shown values and the ability
 * panel levels; the player's applied current-rank slots only while the shown rank is the player's
 * rank; the player's equipped items when the unit is owned, with the equipped relic at the Relic
 * panel's level.
 */
export function characterPowerValues({
  shown,
  player,
  activeLevel,
  passiveLevel,
  equippedRelic,
}: {
  shown: ShownValues
  /** The player's record; undefined for a unit that isn't owned (or no roster). */
  player: PlayerCharacter | undefined
  activeLevel: number
  passiveLevel: number
  /** The equipped relic's id and the Relic panel's level, which it counts at. */
  equippedRelic?: { id: string; level: number }
}): CharacterPowerValues {
  return {
    rank: shown.rank,
    progression: shown.progression,
    appliedUpgradeSlots:
      player && player.rank === shown.rank
        ? (player.appliedUpgradeSlots ?? [])
        : [],
    activeAbilityLevel: activeLevel,
    passiveAbilityLevel: passiveLevel,
    items: (player?.equippedItems ?? []).map(({ equipmentId, level }) => ({
      equipmentId,
      level: equipmentId === equippedRelic?.id ? equippedRelic.level : level,
    })),
  }
}

/** At a glance and Stats by rank: the stats before equipment, or why there are none yet. The
 *  ladder is independent of At a glance: `byRank` is null when any of its ranks cannot be computed
 *  (Stats by rank alone shows unavailable). */
export type StatsFigure =
  | { status: "loading" }
  | { status: "unavailable" }
  | {
      status: "ready"
      stats: UnitStats
      byRank: readonly UnitStats[] | null
    }

export type CharacterPowerView = {
  stats: StatsFigure
  power: PowerFigure
  /** Whether the player's equipped items count in the power ("Includes your equipped items"). */
  includesItems: boolean
}

/**
 * The page's stats and power from one set of values, so the two never disagree: the stats are the
 * power calculation's stat step (no items); each Stats by rank rank counts every slot of the ranks
 * below it and none of its own, except the shown rank, which counts the slots the power counts.
 */
export function characterPowerView(
  characterId: string,
  values: CharacterPowerValues,
  context: ReadState<UnitPowerContext | null>
): CharacterPowerView {
  const power = powerFigure(context, (ready) =>
    characterPowerAt(characterId, values, ready)
  )
  const includesItems = (values.items ?? []).length > 0
  if (context.status === "loading") {
    return { stats: { status: "loading" }, power, includesItems }
  }
  const ready = context.status === "ready" ? context.data : null
  const statsAt = (rank: Rank) =>
    ready
      ? characterStatsAt(
          characterId,
          {
            ...values,
            rank,
            appliedUpgradeSlots:
              rank === values.rank ? values.appliedUpgradeSlots : [],
          },
          ready
        )
      : null
  const stats = statsAt(values.rank)
  if (!stats) return { stats: { status: "unavailable" }, power, includesItems }
  const ladder = ladderRanks.map((rank) => statsAt(rank))
  const byRank = ladder.every((entry) => entry !== null)
    ? (ladder as UnitStats[])
    : null
  return { stats: { status: "ready", stats, byRank }, power, includesItems }
}

/** The player's level for each of the unit's abilities, by ability id. */
export function playerAbilityLevels(
  player: PlayerCharacter | undefined
): Map<string, number> {
  return new Map(
    (player?.abilities ?? []).map((ability) => [
      ability.abilityId,
      ability.level,
    ])
  )
}

/**
 * The relic shown on the page: the one the player has equipped, else the character's own unique
 * relic, else the first relic that can be equipped on it.
 */
export function relicFor(
  character: CharacterStorageModel,
  equipment: readonly EquipmentStorageModel[],
  player: PlayerCharacter | undefined
): { relic: EquipmentStorageModel; equippedLevel?: number } | undefined {
  const relics = equipment.filter(
    (item) => item.isRelic && item.allowedUnits.includes(character.id)
  )
  if (relics.length === 0) return undefined
  for (const equipped of player?.equippedItems ?? []) {
    const relic = relics.find((item) => item.id === equipped.equipmentId)
    if (relic) return { relic, equippedLevel: equipped.level }
  }
  return { relic: relics.find((item) => item.isUniqueRelic) ?? relics[0] }
}

export type ItemStatLine = {
  stat: string
  /** Chance stats are percentages; the rest are flat values. */
  percent: boolean
  /** The value at level 1 and at the item's last level. */
  from: number
  to: number
}

/** An item's stats as shown in its tooltip: each stat at level 1 and at the last level. */
export function itemStatLines(item: EquipmentStorageModel): ItemStatLine[] {
  const first = item.levels[0]?.stats ?? {}
  const last = item.levels.at(-1)?.stats ?? {}
  return Object.entries(first).map(([stat, from]) => ({
    stat,
    percent: stat.includes("Chance"),
    from,
    to: last[stat] ?? from,
  }))
}

/**
 * The items each of the character's slots can take: non-relic equipment of the slot's type that its
 * faction may use (an item with no allowed factions is open to every faction), highest rarity first,
 * then by name. Items whose catalog name starts with "_" have no real name in the game text (unreleased
 * or retired) and are left out.
 */
export function equippableItems(
  character: CharacterStorageModel,
  equipment: readonly EquipmentStorageModel[]
): Map<string, EquipmentStorageModel[]> {
  const usable = equipment.filter(
    (item) =>
      !item.isRelic &&
      !item.name.startsWith("_") &&
      (item.allowedFactions.length === 0 ||
        item.allowedFactions.includes(character.faction))
  )
  return new Map(
    character.equipmentSlots.map((slot) => [
      slot,
      usable
        .filter((item) => item.type === slot)
        .sort(
          (a, b) =>
            rarityRank(b.rarity) - rarityRank(a.rarity) ||
            a.name.localeCompare(b.name)
        ),
    ])
  )
}

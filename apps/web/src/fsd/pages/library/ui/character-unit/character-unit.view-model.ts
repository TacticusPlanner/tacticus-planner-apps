import {
  lastRank,
  rankIndex,
  rarityRank,
  rankOrder,
  startingProgression,
  statAtRank,
  type Progression,
  type Rank,
} from "@workspace/game-domain"
import type {
  CharacterStorageModel,
  EquipmentStorageModel,
} from "@workspace/game-catalog"
import type { PlayerDataChunkDto } from "@workspace/player-data"

export type PlayerCharacter = PlayerDataChunkDto<"characters">[number]

/** The rarity/stars step and rank the page's stats are shown at. */
export type ShownValues = { progression: Progression; rank: Rank }

/**
 * Which header state applies: the player owns the unit (a), is signed in and synced without it
 * (b), or has no roster to compare with — signed out, or signed in before characters synced (c).
 */
export type UnitOwnership = "owned" | "notOwned" | "noRoster"

export function unitOwnership(
  rosterSynced: boolean,
  playerCharacter: PlayerCharacter | undefined
): UnitOwnership {
  if (!rosterSynced) return "noRoster"
  return playerCharacter ? "owned" : "notOwned"
}

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

export type UnitStats = { health: number; damage: number; armour: number }

export function statsAt(
  character: CharacterStorageModel,
  values: ShownValues
): UnitStats {
  return {
    health: statAtRank(character.health, values.rank, values.progression),
    damage: statAtRank(character.damage, values.rank, values.progression),
    armour: statAtRank(character.armour, values.rank, values.progression),
  }
}

/** Every rank of the game's ladder, Stone I to the highest, for Stats by rank. */
export const ladderRanks: readonly Rank[] = rankOrder.filter(
  (rank) => rankIndex(rank) <= rankIndex(lastRank)
)

export function statsByRank(
  character: CharacterStorageModel,
  progression: Progression
): UnitStats[] {
  return ladderRanks.map((rank) => statsAt(character, { progression, rank }))
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

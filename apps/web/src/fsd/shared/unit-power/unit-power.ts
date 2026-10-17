import {
  characterPower,
  characterStats,
  mowPower,
  npcPower,
  UnitPowerDataError,
  type CharacterPowerState,
  type CharacterStats,
  type PowerNpcRow,
  type Progression,
  type Rank,
} from "@workspace/game-domain"

import type { UnitPowerContext } from "./unit-power-context"

/** A synced character record, as the power formula reads it. `abilities[0]` is the active ability
 *  and `abilities[1]` the passive (the synced order). */
export type RosterPowerCharacter = {
  unitId: string
  rank: Rank
  progressionIndex: Progression
  appliedUpgradeSlots?: readonly number[]
  abilities?: readonly { level: number }[]
  equippedItems?: readonly { equipmentId: string; level: number }[]
}

/** A character's state for a power or stats figure; `items` are equipment ids at their levels. */
export type CharacterPowerValues = {
  rank: Rank
  progression: Progression
  appliedUpgradeSlots: readonly number[]
  activeAbilityLevel: number
  passiveAbilityLevel: number
  items?: readonly { equipmentId: string; level: number }[]
}

export type MowPowerValues = {
  progression: Progression
  primaryAbilityLevel: number
  secondaryAbilityLevel: number
}

/** Runs a power figure; null when the game data for it is missing (`UnitPowerDataError`). */
function unlessMissing<T>(compute: () => T | null): T | null {
  try {
    return compute()
  } catch (error) {
    if (error instanceof UnitPowerDataError) return null
    throw error
  }
}

function powerState(
  values: CharacterPowerValues,
  context: UnitPowerContext
): CharacterPowerState | null {
  const items = []
  for (const { equipmentId, level } of values.items ?? []) {
    const item = context.items.get(equipmentId)
    if (!item) return null
    items.push({ item, level })
  }
  return {
    rank: values.rank,
    progression: values.progression,
    appliedUpgradeSlots: [...new Set(values.appliedUpgradeSlots)],
    activeAbilityLevel: values.activeAbilityLevel,
    passiveAbilityLevel: values.passiveAbilityLevel,
    items,
  }
}

/** A character's in-game power at the given values; null when unavailable (unknown unit or item). */
export function characterPowerAt(
  characterId: string,
  values: CharacterPowerValues,
  context: UnitPowerContext
): number | null {
  return unlessMissing(() => {
    const character = context.characters.get(characterId)
    const state = powerState(values, context)
    if (!character || !state) return null
    return characterPower(
      context.tables,
      character,
      state,
      context.upgradeStats
    )
  })
}

/** A character's Health, Damage and Armour before equipment; null when unavailable. */
export function characterStatsAt(
  characterId: string,
  values: CharacterPowerValues,
  context: UnitPowerContext
): CharacterStats | null {
  return unlessMissing(() => {
    const character = context.characters.get(characterId)
    if (!character) return null
    return characterStats(
      context.tables,
      character,
      {
        ...values,
        appliedUpgradeSlots: [...new Set(values.appliedUpgradeSlots)],
        items: [],
      },
      context.upgradeStats
    )
  })
}

/** A synced character's power, items included; 0 when the roster does not hold it (locked), null
 *  when unavailable. */
export function rosterCharacterPower(
  record: RosterPowerCharacter | undefined,
  context: UnitPowerContext
): number | null {
  if (!record) return 0
  return characterPowerAt(
    record.unitId,
    {
      rank: record.rank,
      progression: record.progressionIndex,
      appliedUpgradeSlots: record.appliedUpgradeSlots ?? [],
      activeAbilityLevel: record.abilities?.[0]?.level ?? 1,
      passiveAbilityLevel: record.abilities?.[1]?.level ?? 1,
      items: record.equippedItems ?? [],
    },
    context
  )
}

/** A Machine of War's in-game power; null when unavailable. */
export function mowPowerAt(
  mowId: string,
  values: MowPowerValues,
  context: UnitPowerContext
): number | null {
  return unlessMissing(() => {
    const mow = context.mows.get(mowId)
    return mow ? mowPower(context.tables, mow, values) : null
  })
}

/** An NPC's estimated power at one of its catalog `stats` rows; null when unavailable. */
export function npcPowerAt(
  npcId: string,
  row: PowerNpcRow,
  context: UnitPowerContext
): number | null {
  return unlessMissing(() => {
    const npc = context.npcs.get(npcId)
    return npc ? npcPower(context.tables, npc, row) : null
  })
}

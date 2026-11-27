import { progressionRarity } from "@workspace/game-domain"
import type { Rarity } from "@workspace/game-domain"

import type {
  CatalogCharacter,
  CatalogItem,
  OwnedCharacter,
} from "./owned-items"

const STEP = { goldCost: 100, salvageCost: 10, mythicSalvageCost: 0 }

/** A catalog item for tests: `levels` levels, each with `chance` crit/block chance. */
export function testItem(
  id: string,
  {
    rarity = "Rare",
    type = "I_Crit",
    levels = 5,
    chance = 20,
    isRelic = false,
    allowedUnits = [],
    allowedFactions = [],
    name = id,
  }: {
    rarity?: Rarity
    type?: string
    levels?: number
    chance?: number
    isRelic?: boolean
    allowedUnits?: string[]
    allowedFactions?: string[]
    name?: string
  } = {}
): CatalogItem {
  const chanceStat =
    type === "I_Block"
      ? "blockChance"
      : type === "I_Booster_Block"
        ? "blockChanceBonus"
        : type === "I_Booster_Crit"
          ? "critChanceBonus"
          : type === "I_Crit"
            ? "critChance"
            : undefined
  return {
    id,
    name,
    rarity,
    type,
    isRelic,
    isUniqueRelic: false,
    allowedUnits,
    allowedFactions,
    levels: Array.from({ length: levels }, () => ({
      stats: chanceStat ? { [chanceStat]: chance } : { armor: 10 },
    })),
    upgradeLevels: Array.from({ length: levels }, (_, index) =>
      index === 0 ? { ...STEP, goldCost: 0 } : STEP
    ),
  }
}

/** A catalog character whose every slot may take any of `eligible`. */
export function testCatalogCharacter(
  id: string,
  slots: string[],
  eligible: string[]
): CatalogCharacter {
  return {
    id,
    faction: "Ultramarines",
    equipmentSlots: slots,
    eligibleEquipment: slots.map((slot) => ({ slot, equipmentIds: eligible })),
  }
}

/** An owned character as the models see it. */
export function testOwnedCharacter(
  id: string,
  slots: string[],
  eligible: string[],
  {
    progression = "Legendary:RedThreeStars",
    worn = [],
  }: {
    progression?: OwnedCharacter["progression"]
    worn?: OwnedCharacter["worn"]
  } = {}
): OwnedCharacter {
  return {
    id,
    faction: "Ultramarines",
    progression,
    rarity: progressionRarity(progression),
    slots,
    eligible: slots.map(() => new Set(eligible)),
    worn,
  }
}

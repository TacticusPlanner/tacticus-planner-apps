import type { EquipmentStorageModel } from "@workspace/game-catalog"
import {
  abilityCapByRarity,
  maxRankForProgression,
  progressionOrder,
  progressionRarity,
  type Progression,
  type Rank,
  type Rarity,
} from "@workspace/game-domain"

/** What a tier's rarity cap clamps a deployed unit to (confirmed by Severyn): stars and rank,
 *  ability levels, and items (to the cap rarity's maximum item level). */
export type QuestTierCap = {
  rarity: Rarity
  /** The highest progression step of the rarity, e.g. "Uncommon:FourStars". */
  progression: Progression
  rank: Rank
  abilityLevel: number
  /** The highest level of a non-relic item of that rarity; null without the equipment dataset. */
  itemLevel: number | null
}

export function questTierCap(
  rarity: Rarity,
  equipment: readonly EquipmentStorageModel[] | undefined
): QuestTierCap {
  const progression =
    progressionOrder.findLast((step) => progressionRarity(step) === rarity) ??
    progressionOrder[0]
  const levels = (equipment ?? [])
    .filter((item) => item.rarity === rarity && !item.isRelic)
    .map((item) => item.levels.length)
  return {
    rarity,
    progression,
    rank: maxRankForProgression(progression),
    abilityLevel: abilityCapByRarity[rarity],
    itemLevel: levels.length > 0 ? Math.max(...levels) : null,
  }
}

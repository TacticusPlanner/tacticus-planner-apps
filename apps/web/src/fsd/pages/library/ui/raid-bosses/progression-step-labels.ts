import { rarityOrder } from "@workspace/game-domain"
import type { Rarity } from "@workspace/game-domain"

import type { RaidBossStatStep } from "@/entities/raid-boss"

export type ProgressionStepLabel = {
  /** The step's base rarity, or null when the served token is not a known rarity. */
  rarity: Rarity | null
  /** 1-based index of the step within its base rarity (`Legendary 2`). */
  tierIndex: number
  health: number
}

/**
 * Per-step base rarity + 1-based index within that rarity (e.g. Legendary 2) and total health,
 * mirroring V1's `progression-selector.tsx`. The UI shows the rarity as its icon.
 */
export function buildProgressionStepLabels(
  ladder: RaidBossStatStep[]
): ProgressionStepLabel[] {
  const tierIndexByRarity = new Map<string, number>()
  return ladder.map((entry) => {
    const tierIndex = (tierIndexByRarity.get(entry.baseRarity) ?? 0) + 1
    tierIndexByRarity.set(entry.baseRarity, tierIndex)
    return {
      rarity: toRarity(entry.baseRarity),
      tierIndex,
      health: entry.health,
    }
  })
}

/** The served base-rarity token as a `Rarity`, or null when it is not one. */
export function toRarity(token: string): Rarity | null {
  return rarityOrder.find((rarity) => rarity === token) ?? null
}

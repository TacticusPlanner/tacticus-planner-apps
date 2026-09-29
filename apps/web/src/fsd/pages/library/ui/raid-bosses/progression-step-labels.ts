import { humanizeToken, type RaidBossStatStep } from "@/entities/raid-boss"

/**
 * Per-step `{{rarityTier}}` label (base rarity + 1-based index within that rarity, e.g.
 * `Legendary 2`) and total health, mirroring V1's `progression-selector.tsx`.
 */
export function buildProgressionStepLabels(
  ladder: RaidBossStatStep[]
): { rarityTierLabel: string; health: number }[] {
  const tierIndexByRarity = new Map<string, number>()
  return ladder.map((entry) => {
    const tierIndex = (tierIndexByRarity.get(entry.baseRarity) ?? 0) + 1
    tierIndexByRarity.set(entry.baseRarity, tierIndex)
    return {
      rarityTierLabel: `${humanizeToken(entry.baseRarity)} ${tierIndex}`,
      health: entry.health,
    }
  })
}

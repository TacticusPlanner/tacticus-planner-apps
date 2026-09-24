import { Rarity } from "@workspace/game-domain"

/**
 * NPC stat rows carry a raw 0-14 star index but no rarity of their own, unlike characters. Rules text
 * needs one, because rarity-affected ability variables are multiplied by a per-rarity factor.
 *
 * Ported from V1's `NpcService.resolveRarityFromStars`, which walks `RarityMapper.toMaxStars` — the
 * highest star index each rarity reaches — and takes the first rarity that covers the value:
 * 0-2 Common, 3-4 Uncommon, 5-6 Rare, 7-8 Epic, 9-11 Legendary, 12-14 Mythic.
 */
const MAX_STARS: readonly [Rarity, number][] = [
  [Rarity.Common, 2],
  [Rarity.Uncommon, 4],
  [Rarity.Rare, 6],
  [Rarity.Epic, 8],
  [Rarity.Legendary, 11],
  [Rarity.Mythic, 14],
]

export function rarityFromStars(stars: number): Rarity {
  for (const [rarity, maxStars] of MAX_STARS) {
    if (stars <= maxStars) return rarity
  }
  return Rarity.Mythic
}

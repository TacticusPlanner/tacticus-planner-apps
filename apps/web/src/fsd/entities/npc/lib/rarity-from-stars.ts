import type { ProgressionRulesStorageModel } from "@workspace/game-catalog"
import { rarityOrder, type Rarity } from "@workspace/game-domain"

import { useCatalogDataset } from "@/shared/local-data"

/** The highest star index each rarity reaches, in rarity order. */
export type MaxStarsByRarity = readonly (readonly [Rarity, number])[]

/** A module-level selector for `useCatalogDataset("progression-rules", …)`: the highest `stars` of
 *  each rarity's hero ascension steps (0-2 Common, 3-4 Uncommon, 5-6 Rare, 7-8 Epic, 9-11
 *  Legendary, 12-14 Mythic today). */
export function toMaxStarsByRarity(
  records: readonly Pick<ProgressionRulesStorageModel, "heroProgressionSteps">[]
): MaxStarsByRarity {
  const maxStars = new Map<Rarity, number>()
  for (const step of records[0]?.heroProgressionSteps ?? []) {
    maxStars.set(
      step.rarity,
      Math.max(maxStars.get(step.rarity) ?? 0, step.stars)
    )
  }
  return rarityOrder.flatMap((rarity) => {
    const stars = maxStars.get(rarity)
    return stars === undefined ? [] : [[rarity, stars] as const]
  })
}

/**
 * NPC stat rows carry a raw 0-14 star index but no rarity of their own, unlike characters. Rules text
 * needs one, because rarity-affected ability variables are multiplied by a per-rarity factor.
 *
 * Ported from V1's `NpcService.resolveRarityFromStars`: the first rarity whose highest star index
 * covers the value. A star index beyond the ladder clamps to the top rarity; undefined without a
 * ladder (still loading).
 */
export function rarityFromStars(
  stars: number,
  maxStarsByRarity: MaxStarsByRarity
): Rarity | undefined {
  const covering = maxStarsByRarity.find(([, maxStars]) => stars <= maxStars)
  return (covering ?? maxStarsByRarity.at(-1))?.[0]
}

/** The rarity of an NPC star index; undefined until `progression-rules` has loaded. */
export function useRarityFromStars(stars: number): Rarity | undefined {
  const read = useCatalogDataset("progression-rules", toMaxStarsByRarity)
  return read.status === "ready" ? rarityFromStars(stars, read.data) : undefined
}

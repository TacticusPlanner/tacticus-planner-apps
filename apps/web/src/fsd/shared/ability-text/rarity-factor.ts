import type { ProgressionRulesStorageModel } from "@workspace/game-catalog"
import type { Rarity } from "@workspace/game-domain"

import { useCatalogDataset } from "@/shared/local-data"

/** A module-level selector for `useCatalogDataset("progression-rules", …)`: the factor each rarity
 *  scales an ability's rarity-affected values by — the game's `abilityStatMultiplierPct` of that
 *  rarity's hero ascension steps, as a fraction (Common 1 … Mythic 2). */
export function toRarityFactors(
  records: readonly Pick<ProgressionRulesStorageModel, "heroProgressionSteps">[]
): ReadonlyMap<Rarity, number> {
  return new Map(
    (records[0]?.heroProgressionSteps ?? []).map((step) => [
      step.rarity,
      step.abilityStatMultiplierPct / 100,
    ])
  )
}

/** The rarity factor of `rarity`; undefined until both it and `progression-rules` are known. */
export function useRarityFactor(
  rarity: Rarity | undefined
): number | undefined {
  const read = useCatalogDataset("progression-rules", toRarityFactors)
  return read.status === "ready" && rarity ? read.data.get(rarity) : undefined
}

import type { DamageTypeStorageModel } from "@workspace/game-catalog"

/**
 * The share of a hit's damage that still lands through infinite armour (0–1), by damage type id: the
 * floor a hit can never be mitigated below, however high the target's armour. From the catalog's
 * `damage-types` (the game's `PiercingRatio` percentage).
 */
export type PierceRatios = ReadonlyMap<string, number>

/** A module-level selector for `useCatalogDataset("damage-types", …)`. */
export function toPierceRatios(
  damageTypes: readonly Pick<DamageTypeStorageModel, "id" | "piercingRatio">[]
): Map<string, number> {
  return new Map(
    damageTypes.map((damageType) => [
      damageType.id,
      damageType.piercingRatio / 100,
    ])
  )
}

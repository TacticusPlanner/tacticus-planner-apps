import type { UpgradeStorageModel } from "@workspace/game-catalog"

import type { ReadState } from "@/shared/lib"
import { useCatalogDataset } from "@/shared/local-data"

import { mapUpgradeStorageToDomain } from "../lib/rank-lookup.mapper"
import type { UpgradeWithFarmLocations } from "../lib/rank-lookup.mapper"

/** Domain upgrades keyed by their catalog id. */
export type UpgradesById = Map<
  UpgradeStorageModel["id"],
  UpgradeWithFarmLocations
>

/** The upgrades catalog as domain upgrades by id; a module-level selector, so the map stays the
 *  same object while the dataset is unchanged. */
function toUpgradesById(records: UpgradeStorageModel[]): UpgradesById {
  return new Map(
    records.map((record) => [record.id, mapUpgradeStorageToDomain(record)])
  )
}

/** The upgrades catalog as a list of domain upgrades; a module-level selector, like `toUpgradesById`. */
function toDomainUpgrades(
  records: UpgradeStorageModel[]
): UpgradeWithFarmLocations[] {
  return records.map(mapUpgradeStorageToDomain)
}

/** The upgrades catalog as domain upgrades by id, read once per session and shared. */
export function useUpgradesById(): ReadState<UpgradesById> {
  return useCatalogDataset("upgrades", toUpgradesById)
}

/** The upgrades catalog as a list of domain upgrades, read once per session and shared. */
export function useDomainUpgrades(): ReadState<UpgradeWithFarmLocations[]> {
  return useCatalogDataset("upgrades", toDomainUpgrades)
}

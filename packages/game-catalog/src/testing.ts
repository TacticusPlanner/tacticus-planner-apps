// Test-only entry point: lets consumers seed the real catalog store instead of mocking its queries.
import Dexie from "dexie"

import { catalogDbName } from "./game-catalog-storage"

export { replaceGameCatalogDataset } from "./game-catalog-storage"

/** Drops the catalog database; Dexie reopens it on next access. */
export function deleteGameCatalogDatabase() {
  return Dexie.delete(catalogDbName)
}

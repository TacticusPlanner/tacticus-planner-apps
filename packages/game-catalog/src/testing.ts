// Test-only entry point: lets consumers seed the real catalog store instead of mocking its queries.
import Dexie from "dexie"

import { catalogDbName } from "./game-catalog-storage"

export { replaceGameCatalogDataset } from "./game-catalog-storage"

/** Drops the catalog database; Dexie reopens it on next access. */
export function deleteGameCatalogDatabase() {
  return Dexie.delete(catalogDbName)
}

// The served `quest-events` and `quest-crates` payloads for the shipped quests (Cyrus, Nubari, Kîmm),
// parsed through the catalog schemas, so feature tests read the same shapes the sync stores.
export { questCratesFixture, questEventsFixture } from "./quests.fixtures"

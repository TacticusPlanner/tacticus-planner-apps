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

// The served `global-values` record, parsed through the catalog schema and keyed as the store keys it.
export { globalValuesFixture } from "./global-values.fixtures"

// The served `progression-rules` record, parsed through the catalog schema and keyed as the store keys it.
export { progressionRulesFixture } from "./progression-rules.fixtures"

// The served `hre` records (both Hero Release Events), parsed through the catalog schema.
export { hreFixture } from "./hre.fixtures"

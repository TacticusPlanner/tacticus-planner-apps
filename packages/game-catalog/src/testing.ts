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

// Served `incursions` records (trimmed tiers), parsed through the catalog schema and keyed by MoW id.
export { incursionsFixture } from "./incursions.fixtures"

// Served `guild-war` records (Seasons A and D, trimmed buff values), parsed through the catalog schema.
export { guildWarFixture } from "./guild-war.fixtures"

// Served `survival-events` records (Crescendo A and December 2026, every wave, trimmed ladders),
// parsed through the catalog schema.
export { survivalEventsFixture } from "./survival-events.fixtures"

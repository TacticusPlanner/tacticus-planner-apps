// Dedicated entry point for named, business-purpose read queries safe to pass directly to
// `useLiveQuery` (dexie-react-hooks) — one function per thing a caller actually wants, not a generic
// dataset-key accessor. Components import from here, never from the main package barrel and never
// touching the Dexie instance itself. Add a new named query here as new business needs arise.
import {
  getDatasetRecords,
  type CampaignBattleRecord,
  type CampaignDefinitionRecord,
  type CharacterRecord,
  type UpgradeRecord,
} from "./game-catalog-storage"

export function getCharacters(): Promise<CharacterRecord[]> {
  return getDatasetRecords("characters")
}

export function getUpgrades(): Promise<UpgradeRecord[]> {
  return getDatasetRecords("upgrades")
}

export function getCampaignBattles(): Promise<CampaignBattleRecord[]> {
  return getDatasetRecords("campaign-battles")
}

export function getCampaignDefinitions(): Promise<CampaignDefinitionRecord[]> {
  return getDatasetRecords("campaign-definitions")
}

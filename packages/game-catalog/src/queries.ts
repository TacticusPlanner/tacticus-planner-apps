// Dedicated entry point for named, business-purpose read queries safe to pass directly to
// `useLiveQuery` (dexie-react-hooks) — one function per thing a caller actually wants, not a generic
// dataset-key accessor. Components import from here, never from the main package barrel and never
// touching the Dexie instance itself. Add a new named query here as new business needs arise.
import { getDatasetRecords } from "./game-catalog-storage"
import type {
  CampaignBattleStorageModel,
  CampaignDefinitionStorageModel,
  CharacterStorageModel,
  MowStorageModel,
  UpgradeStorageModel,
} from "./game-catalog.storage"

export function getCharacters(): Promise<CharacterStorageModel[]> {
  return getDatasetRecords("characters")
}

// Dexie has no built-in "return this table as a Map" method — this just wraps getCharacters()'s
// array in one, for the common case of a caller indexing characters by id (e.g. Character Lookup's
// charactersById) instead of hand-rolling `new Map(records.map(...))` at every call site.
export async function getCharactersMap(): Promise<
  Map<string, CharacterStorageModel>
> {
  const characters = await getCharacters()
  return new Map(characters.map((character) => [character.id, character]))
}

export function getMows(): Promise<MowStorageModel[]> {
  return getDatasetRecords("mows")
}

// Mirrors getCharactersMap() — the common case of indexing Machines of War by id.
export async function getMowsMap(): Promise<Map<string, MowStorageModel>> {
  const mows = await getMows()
  return new Map(mows.map((mow) => [mow.id, mow]))
}

export function getUpgrades(): Promise<UpgradeStorageModel[]> {
  return getDatasetRecords("upgrades")
}

export function getCampaignBattles(): Promise<CampaignBattleStorageModel[]> {
  return getDatasetRecords("campaign-battles")
}

export function getCampaignDefinitions(): Promise<
  CampaignDefinitionStorageModel[]
> {
  return getDatasetRecords("campaign-definitions")
}

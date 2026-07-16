// Dedicated entry point for named, business-purpose read queries safe to pass directly to
// `useLiveQuery` (dexie-react-hooks) — one function per thing a caller actually wants, not a generic
// dataset-key accessor. Components import from here, never from the main package barrel and never
// touching the Dexie instance itself. Add a new named query here as new business needs arise.
import { getDatasetRecords } from "./game-catalog-storage"
import type {
  AscensionCostStorageModel,
  CampaignBattleStorageModel,
  CampaignDefinitionStorageModel,
  CharacterStorageModel,
  MowStorageModel,
  OnslaughtRewardStorageModel,
  UnlockShardCostStorageModel,
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

export function getAscensionCosts(): Promise<AscensionCostStorageModel[]> {
  return getDatasetRecords("ascension-costs")
}

// Indexes the shared ascension cost ladder by progression step (its natural, storage-managed id).
export async function getAscensionCostsMap(): Promise<
  Map<string, AscensionCostStorageModel>
> {
  const costs = await getAscensionCosts()
  return new Map(costs.map((cost) => [cost.id, cost]))
}

export function getUnlockShardCosts(): Promise<UnlockShardCostStorageModel[]> {
  return getDatasetRecords("unlock-shard-costs")
}

export function getOnslaughtRewards(): Promise<OnslaughtRewardStorageModel[]> {
  return getDatasetRecords("onslaught-rewards")
}

// Indexes the per-rarity unlock shard cost table by rarity (its natural, storage-managed id).
export async function getUnlockShardCostsMap(): Promise<
  Map<string, UnlockShardCostStorageModel>
> {
  const costs = await getUnlockShardCosts()
  return new Map(costs.map((cost) => [cost.id, cost]))
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

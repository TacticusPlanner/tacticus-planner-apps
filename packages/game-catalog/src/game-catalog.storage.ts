import type { GameCatalogDatasetKey } from "./types"
import type { GameCatalogRecordByKey } from "./schemas"

// A persisted row: the validated dataset payload plus the storage-managed string id.
export type StorageModel<K extends GameCatalogDatasetKey> =
  GameCatalogRecordByKey[K] & {
    id: string
  }

// Named aliases for the datasets consumers most commonly read via `@workspace/game-catalog/queries`,
// so call sites can name the storage-model type instead of re-deriving it from `StorageModel<"...">`
// each time.
export type CharacterStorageModel = StorageModel<"characters">
export type UpgradeStorageModel = StorageModel<"upgrades">
export type CampaignBattleStorageModel = StorageModel<"campaign-battles">
export type CampaignDefinitionStorageModel =
  StorageModel<"campaign-definitions">

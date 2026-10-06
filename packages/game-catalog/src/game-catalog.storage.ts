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
export type MowStorageModel = StorageModel<"mows">
export type NpcStorageModel = StorageModel<"npcs">
export type MowUpgradeCostStorageModel = StorageModel<"mow-upgrade-costs">
export type CharacterAbilityCostStorageModel =
  StorageModel<"character-ability-costs">
export type AscensionCostStorageModel = StorageModel<"ascension-costs">
export type UnlockShardCostStorageModel = StorageModel<"unlock-shard-costs">
export type OnslaughtRewardStorageModel = StorageModel<"onslaught-rewards">
export type UpgradeStorageModel = StorageModel<"upgrades">
export type EquipmentStorageModel = StorageModel<"equipment">
export type CampaignBattleStorageModel = StorageModel<"campaign-battles">
export type CampaignDefinitionStorageModel =
  StorageModel<"campaign-definitions">
export type EventDefinitionStorageModel = StorageModel<"event-definitions">
export type EventsCalendarStorageModel = StorageModel<"events-calendar">
export type ShopStorageModel = StorageModel<"shops">
export type RaidBossesStorageModel = StorageModel<"raid-bosses">
export type GuildRaidMetaStorageModel = StorageModel<"guild-raid-meta">
// Legendary Event datasets. Named by the glossary ("Legendary Event"), while the storage keys keep
// their V1 names (`lres`, `lre-common`) until the pending API rename to `legendary-events` lands.
export type LegendaryEventStorageModel = StorageModel<"lres">
export type LegendaryEventCommonStorageModel = StorageModel<"lre-common">

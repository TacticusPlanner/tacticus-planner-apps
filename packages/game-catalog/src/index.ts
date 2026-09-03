export {
  servedDatasetKeys,
  isServedDatasetKey,
  catalogManifestMetadataKey,
  type GameCatalogDatasetKey,
  type GameCatalogManifest,
  type GameCatalogManifestDataset,
  type GameCatalogDatasetEnvelope,
  type GameCatalogDatasetMetadata,
  type GameCatalogRecordByKey,
  type GameCatalogCharacterView,
  type GameCatalogNpc,
  type GameCatalogMow,
  type GameCatalogAscensionCost,
  type GameCatalogUnlockShardCost,
  type GameCatalogOnslaughtReward,
  type GameCatalogUpgradeView,
  type GameCatalogEquipment,
  type GameCatalogCampaignDefinitionView,
  type GameCatalogLreView,
  type GameCatalogEventDefinition,
  type GameCatalogEventRecurrence,
  type GameCatalogEventsCalendarEntry,
} from "./types"

export type {
  GameCatalogCampaignBattleView,
  GameCatalogLreTrackView,
  GameCatalogLreBattle,
  GameCatalogLreBattleView,
  GameCatalogLreCommon,
  GameCatalogLreWave,
  GameCatalogLreEnemy,
  GameCatalogFarmLocation,
  GameCatalogUpgradeRecipeIngredient,
  GameCatalogMowUpgradeCost,
  GameCatalogEquipmentUpgradeCost,
  GameCatalogShop,
  GameCatalogShopSlot,
  GameCatalogShopVariant,
} from "./record-types"

export { shopDaysOfWeek, type ShopDayOfWeek } from "./schemas/shops"

export {
  resolveShopOffersForToday,
  resolveShopSlotsForDay,
  computeShopLockContext,
  plTier,
  hasBlueStarUnit,
  shardRewardEligible,
  lockIsActive,
  resolveEventLockId,
  bpSeasonStartMs,
  todayDow,
  DOW_MAP,
  PL_MEDIUM,
  MYTHIC_UNCRAFTABLE_UPGRADES,
  MYTHIC_UNCRAFTABLE_UPGRADE_IDS,
  type ResolvedShopOffer,
  type ResolvedShopSlot,
  type ShopLockContext,
  type RosterUnit,
  type ResolveShopOffersForTodayOptions,
  type ResolveShopSlotsForDayOptions,
} from "./shops/shop-resolve"

export {
  manifestSchema,
  datasetEnvelopeMetaSchema,
  datasetPayloadSchemas,
} from "./schemas"

export {
  GameCatalogHttpClient,
  type GameCatalogClient,
  type GameCatalogManifestResult,
} from "./game-catalog-api"

export {
  syncGameCatalog,
  selectChangedDatasets,
  type GameCatalogSyncResult,
  type GameCatalogSyncProgress,
  type GameCatalogSyncOptions,
} from "./game-catalog-sync"

export {
  getGameCatalogMetadata,
  getManifestMetadata,
  hasCompleteGameCatalogCache,
  clearGameCatalogDb,
  deleteGameCatalogDb,
} from "./game-catalog-storage"

export {
  type StorageModel,
  type CharacterStorageModel,
  type MowStorageModel,
  type NpcStorageModel,
  type AscensionCostStorageModel,
  type UnlockShardCostStorageModel,
  type OnslaughtRewardStorageModel,
  type UpgradeStorageModel,
  type EquipmentStorageModel,
  type CampaignBattleStorageModel,
  type CampaignDefinitionStorageModel,
  type EventDefinitionStorageModel,
  type EventsCalendarStorageModel,
  type ShopStorageModel,
} from "./game-catalog.storage"

export {
  rarityClass,
  ASSET_BASE_PATH,
  UpgradeIcons,
  rarityIcon,
  rankIcon,
  onslaughtTierIcon,
  onslaughtAllianceIcon,
  shardIcon,
  characterIcon,
  mowIcon,
  campaignIcon,
  campaignDescriptor,
  type CampaignDescriptor,
  type CampaignDifficultyToken,
  traitIcon,
  damageTypeIcon,
  equipmentSlotIcon,
  EquipmentIcons,
  statIcon,
  type StatIconKind,
  progressionVisual,
  type ProgressionVisual,
  type OnslaughtSectorIcon,
  type OnslaughtTierIcon,
  type OnslaughtAllianceIcon,
} from "./game-entities"

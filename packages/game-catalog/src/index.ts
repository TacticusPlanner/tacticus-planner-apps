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
} from "./record-types"

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
} from "./game-catalog-storage"

export {
  type StorageModel,
  type CharacterStorageModel,
  type MowStorageModel,
  type AscensionCostStorageModel,
  type UnlockShardCostStorageModel,
  type OnslaughtRewardStorageModel,
  type UpgradeStorageModel,
  type EquipmentStorageModel,
  type CampaignBattleStorageModel,
  type CampaignDefinitionStorageModel,
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

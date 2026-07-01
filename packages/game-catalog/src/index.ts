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
  getDatasetRecords,
  getDatasetRecord,
  clearGameCatalogDb,
  type GameCatalogStoredRecord,
  type StoredRecord,
} from "./game-catalog-storage"

export {
  GameCatalogProvider,
  useGameCatalogStatus,
  useDatasetRecords,
  type GameCatalogStatus,
  type GameCatalogContextValue,
  type GameCatalogProviderProps,
} from "./game-catalog-context"

export {
  Rarity,
  rarityOrder,
  rarityRank,
  Rank,
  rankOrder,
  firstRank,
  lastRank,
  rankIndex,
  rankAt,
  isRank,
  isAdamantineRank,
  Alliance,
  allianceOrder,
  allianceRank,
  type CharacterId,
  type UpgradeId,
  type FactionId,
  type BattleId,
  type CampaignGroupId,
  upgradeIcon,
  upgradeIconFallback,
  upgradeUnderlay,
  upgradeFrameIcon,
  craftedUpgradeBadge,
  rarityIcon,
  rankIcon,
  characterIcon,
  campaignIcon,
  campaignLabel,
} from "./game-entities"

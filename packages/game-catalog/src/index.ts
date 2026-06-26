export {
  servedDatasetKeys,
  isServedDatasetKey,
  catalogManifestMetadataKey,
  type CatalogDatasetKey,
  type CatalogManifest,
  type CatalogManifestDataset,
  type CatalogDatasetEnvelope,
  type CatalogDatasetMetadata,
  type CatalogRecordByKey,
  type CatalogCharacterView,
  type CatalogNpc,
  type CatalogMow,
  type CatalogUpgradeView,
  type CatalogEquipment,
  type CatalogCampaignGroupView,
  type CatalogLreView,
  type CatalogMowDataset,
  type CatalogEquipmentDataset,
} from "./types"

export type {
  CatalogCampaignBattleView,
  CatalogLreTrackView,
  CatalogLreBattle,
  CatalogLreWave,
  CatalogLreEnemy,
  CatalogFarmLocation,
  CatalogUpgradeExpansion,
  CatalogMowUpgradeCost,
  CatalogEquipmentUpgradeCost,
} from "./record-types"

export {
  manifestSchema,
  datasetEnvelopeMetaSchema,
  datasetPayloadSchemas,
} from "./schemas"

export {
  CatalogHttpClient,
  type CatalogClient,
  type CatalogManifestResult,
} from "./catalog-api"

export {
  syncCatalog,
  selectChangedDatasets,
  type CatalogSyncResult,
  type CatalogSyncProgress,
  type CatalogSyncOptions,
} from "./catalog-sync"

export {
  getCatalogMetadata,
  getManifestMetadata,
  hasCompleteCatalogCache,
  getDatasetRecords,
  getDatasetRecord,
  searchDataset,
  getDatasetExtras,
  clearCatalogDb,
  type CatalogStoredRecord,
  type StoredRecord,
  type CatalogExtrasByKey,
} from "./catalog-storage"

export {
  CatalogProvider,
  useCatalogStatus,
  useDatasetRecords,
  useDatasetSearch,
  useDatasetExtras,
  type CatalogStatus,
  type CatalogContextValue,
  type CatalogProviderProps,
} from "./catalog-context"

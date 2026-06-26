import type { z } from "zod"

import {
  catalogManifestMetadataKey,
  type GameCatalogDatasetKey,
} from "./dataset-keys"
import type {
  datasetEnvelopeMetaSchema,
  manifestDatasetSchema,
  manifestSchema,
} from "./schemas"

export {
  servedDatasetKeys,
  isServedDatasetKey,
  catalogManifestMetadataKey,
  type GameCatalogDatasetKey,
} from "./dataset-keys"

export type { GameCatalogRecordByKey } from "./schemas"
export type {
  GameCatalogCharacterView,
  GameCatalogNpc,
  GameCatalogMow,
  GameCatalogUpgradeView,
  GameCatalogEquipment,
  GameCatalogCampaignBattleView,
  GameCatalogCampaignDefinitionView,
  GameCatalogLreView,
} from "./record-types"

// All catalog API shapes are inferred from the zod schemas that validate them at runtime.
export type GameCatalogManifest = z.infer<typeof manifestSchema>
export type GameCatalogManifestDataset = z.infer<typeof manifestDatasetSchema>
export type GameCatalogDatasetEnvelope = z.infer<
  typeof datasetEnvelopeMetaSchema
>

// Internal IndexedDB metadata (not an API shape): per-dataset rows + the manifest sync-metadata row.
export type GameCatalogDatasetMetadata = {
  key: GameCatalogDatasetKey | typeof catalogManifestMetadataKey
  hash: string
  catalogVersion: string
  gameVersion: string
  schemaVersion: number
  updatedAt: string
  etag?: string | null
  url?: string
}

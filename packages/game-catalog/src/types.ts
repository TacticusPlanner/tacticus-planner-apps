import type { z } from "zod"

import {
  catalogManifestMetadataKey,
  type CatalogDatasetKey,
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
  type CatalogDatasetKey,
} from "./dataset-keys"

export type { CatalogRecordByKey } from "./schemas"
export type {
  CatalogCharacterView,
  CatalogNpc,
  CatalogMow,
  CatalogUpgradeView,
  CatalogEquipment,
  CatalogCampaignGroupView,
  CatalogLreView,
  CatalogMowDataset,
  CatalogEquipmentDataset,
} from "./record-types"

// All catalog API shapes are inferred from the zod schemas that validate them at runtime.
export type CatalogManifest = z.infer<typeof manifestSchema>
export type CatalogManifestDataset = z.infer<typeof manifestDatasetSchema>
export type CatalogDatasetEnvelope = z.infer<typeof datasetEnvelopeMetaSchema>

// Internal IndexedDB metadata (not an API shape).
export type CatalogDatasetMetadata = {
  key: CatalogDatasetKey | typeof catalogManifestMetadataKey
  hash: string
  catalogVersion: string
  gameVersion: string
  schemaVersion: number
  updatedAt: string
  etag?: string | null
  url?: string
}

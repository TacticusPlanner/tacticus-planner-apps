import type { z } from "zod"

import {
  catalogManifestMetadataKey,
  type GameCatalogDatasetKey,
} from "./dataset-keys"
import type {
  datasetEnvelopeMetaSchema,
  hseConfigSchema,
  hseMilestoneSchema,
  hseRepeatSchema,
  hseRestrictionSchema,
  hseStatBoostModifierSchema,
  hseTierSchema,
  hseTrackerSchema,
  hseUnitFilterSchema,
  hseUnitXpModifierSchema,
  hseVariantSchema,
  manifestDatasetSchema,
  manifestSchema,
} from "./schemas"

export {
  servedDatasetKeys,
  optionalDatasetKeys,
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
  GameCatalogCampaignDefinitionView,
  GameCatalogLreView,
  GameCatalogAscensionCost,
  GameCatalogUnlockShardCost,
  GameCatalogOnslaughtReward,
  GameCatalogEventDefinition,
  GameCatalogEventRecurrence,
  GameCatalogEventsCalendarEntry,
  GameCatalogGuildRaidMeta,
} from "./record-types"

// All catalog API shapes are inferred from the zod schemas that validate them at runtime.
export type GameCatalogManifest = z.infer<typeof manifestSchema>
export type GameCatalogManifestDataset = z.infer<typeof manifestDatasetSchema>
export type GameCatalogDatasetEnvelope = z.infer<
  typeof datasetEnvelopeMetaSchema
>

// Home Screen Event scoring served under a HomeScreenEvent definition's `config.hse`.
export type GameCatalogHseConfig = z.infer<typeof hseConfigSchema>
export type GameCatalogHseVariant = z.infer<typeof hseVariantSchema>
export type GameCatalogHseTier = z.infer<typeof hseTierSchema>
export type GameCatalogHseTierKey = GameCatalogHseTier["tier"]
export type GameCatalogHseMilestone = z.infer<typeof hseMilestoneSchema>
export type GameCatalogHseRepeat = z.infer<typeof hseRepeatSchema>
export type GameCatalogHseTracker = z.infer<typeof hseTrackerSchema>
export type GameCatalogHseUnitFilter = z.infer<typeof hseUnitFilterSchema>
export type GameCatalogHseRestriction = z.infer<typeof hseRestrictionSchema>
export type GameCatalogHseUnitXpModifier = z.infer<
  typeof hseUnitXpModifierSchema
>
export type GameCatalogHseStatBoostModifier = z.infer<
  typeof hseStatBoostModifierSchema
>
export type GameCatalogHseModifier =
  GameCatalogHseUnitXpModifier | GameCatalogHseStatBoostModifier

// Internal IndexedDB metadata (not an API shape): per-dataset rows + the manifest sync-metadata row.
export type GameCatalogDatasetMetadata = {
  key: GameCatalogDatasetKey | typeof catalogManifestMetadataKey
  hash: string
  catalogVersion: string
  gameVersion: string
  schemaHash?: string
  updatedAt: string
  etag?: string | null
  url?: string
}

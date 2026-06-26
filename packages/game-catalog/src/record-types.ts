import type { z } from "zod"

import type {
  campaignBattleViewSchema,
  campaignGroupViewSchema,
  characterViewSchema,
  equipmentDatasetSchema,
  equipmentSchema,
  equipmentUpgradeCostSchema,
  farmLocationSchema,
  lreBattleSchema,
  lreEnemySchema,
  lreTrackViewSchema,
  lreViewSchema,
  lreWaveSchema,
  mowDatasetSchema,
  mowSchema,
  mowUpgradeCostSchema,
  npcSchema,
  upgradeExpansionSchema,
  upgradeViewSchema,
} from "./schemas"

// Named types inferred from the validating schemas, for ergonomic consumption across the app.
export type CatalogCharacterView = z.infer<typeof characterViewSchema>
export type CatalogNpc = z.infer<typeof npcSchema>
export type CatalogMow = z.infer<typeof mowSchema>
export type CatalogUpgradeView = z.infer<typeof upgradeViewSchema>
export type CatalogEquipment = z.infer<typeof equipmentSchema>
export type CatalogCampaignGroupView = z.infer<typeof campaignGroupViewSchema>
export type CatalogCampaignBattleView = z.infer<typeof campaignBattleViewSchema>
export type CatalogLreView = z.infer<typeof lreViewSchema>
export type CatalogLreTrackView = z.infer<typeof lreTrackViewSchema>
export type CatalogLreBattle = z.infer<typeof lreBattleSchema>
export type CatalogLreWave = z.infer<typeof lreWaveSchema>
export type CatalogLreEnemy = z.infer<typeof lreEnemySchema>
export type CatalogFarmLocation = z.infer<typeof farmLocationSchema>
export type CatalogUpgradeExpansion = z.infer<typeof upgradeExpansionSchema>
export type CatalogMowUpgradeCost = z.infer<typeof mowUpgradeCostSchema>
export type CatalogEquipmentUpgradeCost = z.infer<
  typeof equipmentUpgradeCostSchema
>

export type CatalogMowDataset = z.infer<typeof mowDatasetSchema>
export type CatalogEquipmentDataset = z.infer<typeof equipmentDatasetSchema>

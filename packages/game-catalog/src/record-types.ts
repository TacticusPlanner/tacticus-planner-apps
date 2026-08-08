import type { z } from "zod"

import type {
  campaignBattleViewSchema,
  campaignDefinitionSchema,
  characterViewSchema,
  equipmentSchema,
  equipmentUpgradeCostSchema,
  eventDefinitionSchema,
  eventRecurrenceSchema,
  eventsCalendarEntrySchema,
  farmLocationSchema,
  lreBattleSchema,
  lreBattleViewSchema,
  lreCommonSchema,
  lreEnemySchema,
  lreTrackViewSchema,
  lreViewSchema,
  lreWaveSchema,
  mowSchema,
  mowUpgradeCostSchema,
  npcSchema,
  onslaughtRewardSchema,
  ascensionCostSchema,
  unlockShardCostSchema,
  upgradeViewSchema,
} from "./schemas"

export type { GameCatalogUpgradeRecipeIngredient } from "./schemas"

// Named types inferred from the validating schemas, for ergonomic consumption across the app.
export type GameCatalogCharacterView = z.infer<typeof characterViewSchema>
export type GameCatalogNpc = z.infer<typeof npcSchema>
export type GameCatalogMow = z.infer<typeof mowSchema>
export type GameCatalogUpgradeView = z.infer<typeof upgradeViewSchema>
export type GameCatalogEquipment = z.infer<typeof equipmentSchema>
export type GameCatalogCampaignBattleView = z.infer<
  typeof campaignBattleViewSchema
>
export type GameCatalogCampaignDefinitionView = z.infer<
  typeof campaignDefinitionSchema
>
export type GameCatalogLreView = z.infer<typeof lreViewSchema>
export type GameCatalogLreTrackView = z.infer<typeof lreTrackViewSchema>
export type GameCatalogLreBattle = z.infer<typeof lreBattleSchema>
export type GameCatalogLreBattleView = z.infer<typeof lreBattleViewSchema>
export type GameCatalogLreCommon = z.infer<typeof lreCommonSchema>
export type GameCatalogLreWave = z.infer<typeof lreWaveSchema>
export type GameCatalogLreEnemy = z.infer<typeof lreEnemySchema>
export type GameCatalogFarmLocation = z.infer<typeof farmLocationSchema>
export type GameCatalogMowUpgradeCost = z.infer<typeof mowUpgradeCostSchema>
export type GameCatalogAscensionCost = z.infer<typeof ascensionCostSchema>
export type GameCatalogUnlockShardCost = z.infer<typeof unlockShardCostSchema>
export type GameCatalogOnslaughtReward = z.infer<typeof onslaughtRewardSchema>
export type GameCatalogEquipmentUpgradeCost = z.infer<
  typeof equipmentUpgradeCostSchema
>
export type GameCatalogEventDefinition = z.infer<typeof eventDefinitionSchema>
export type GameCatalogEventRecurrence = z.infer<typeof eventRecurrenceSchema>
export type GameCatalogEventsCalendarEntry = z.infer<
  typeof eventsCalendarEntrySchema
>

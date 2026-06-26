import { z } from "zod"

import type { CatalogDatasetKey } from "./dataset-keys"

// Loose objects preserve unknown (server-added) fields and only fail on genuine shape/type breaks.
// `JsonElement` fields on the server are opaque here (stored as-is) → z.unknown().

// ---- shared / nested -------------------------------------------------------------------------
export const farmLocationSchema = z.looseObject({
  battleId: z.string(),
  difficulty: z.string(),
  guaranteed: z.boolean(),
  chanceId: z.string().nullish(),
  numerator: z.number().nullish(),
  denominator: z.number().nullish(),
  effectiveRate: z.number().nullish(),
})

export const equipmentSlotSchema = z.looseObject({
  slot: z.string(),
  equipmentIds: z.array(z.string()),
})

export const characterRankUpSchema = z.looseObject({
  rank: z.string(),
  upgradeIds: z.array(z.string()),
})

export const upgradeRecipeIngredientSchema = z.looseObject({
  material: z.string(),
  count: z.number(),
})

export const upgradeExpansionSchema = z.looseObject({
  baseUpgrades: z.record(z.string(), z.number()),
  craftedUpgrades: z.record(z.string(), z.number()),
  totalBaseCount: z.number(),
  totalCraftedCount: z.number(),
})

export const amountByRaritySchema = z.looseObject({
  rarity: z.string(),
  amount: z.number(),
})

export const mowAbilitySchema = z.looseObject({
  name: z.string(),
  recipes: z.array(z.array(z.string())),
})

export const mowUpgradeCostSchema = z.looseObject({
  gold: z.number(),
  salvage: z.number(),
  badges: amountByRaritySchema,
  forgeBadges: amountByRaritySchema.nullish(),
  components: z.number(),
})

export const equipmentUpgradeLevelSchema = z.looseObject({
  goldCost: z.number(),
  salvageCost: z.number(),
  mythicSalvageCost: z.number(),
})

export const equipmentUpgradeCostSchema = z.looseObject({
  rarity: z.string(),
  levels: z.array(equipmentUpgradeLevelSchema),
})

export const campaignGuaranteedRewardSchema = z.looseObject({
  id: z.string(),
  min: z.number().nullish(),
  max: z.number().nullish(),
})

export const campaignPotentialRewardViewSchema = z.looseObject({
  id: z.string(),
  chanceId: z.string().nullish(),
  rewardKind: z.string().nullish(),
  numerator: z.number().nullish(),
  denominator: z.number().nullish(),
  effectiveRate: z.number().nullish(),
})

export const campaignRewardsViewSchema = z.looseObject({
  guaranteed: z.array(campaignGuaranteedRewardSchema),
  potential: z.array(campaignPotentialRewardViewSchema),
})

export const campaignDetailedEnemySchema = z.looseObject({
  id: z.string(),
  name: z.string(),
  count: z.number(),
  stars: z.number(),
  rank: z.string(),
})

export const lreFilterSchema = z.looseObject({
  kind: z.string(),
  target: z.string(),
  exclude: z.boolean(),
})

export const lreRestrictionSchema = z.looseObject({
  name: z.string(),
  points: z.number(),
  iconId: z.string().nullish(),
  index: z.number(),
  filter: lreFilterSchema,
})

export const lreTrackEnemiesSchema = z.looseObject({
  label: z.string(),
  link: z.string(),
})

export const lreEnemySchema = z.looseObject({
  id: z.string(),
  stars: z.number(),
  count: z.number(),
})

export const lreWaveSchema = z.looseObject({
  round: z.number(),
  power: z.number(),
  enemies: z.array(lreEnemySchema),
})

export const lreBattleSchema = z.looseObject({
  mapId: z.string(),
  number: z.number(),
  power: z.number(),
  tier: z.number(),
  disallowedFactions: z.array(z.string()),
  waves: z.array(lreWaveSchema),
})

export const lreTrackViewSchema = z.looseObject({
  name: z.string(),
  enemies: lreTrackEnemiesSchema,
  killPoints: z.number(),
  battlesPoints: z.array(z.number()),
  defeatAll: z.array(z.number()),
  allowedUnitsFilter: z.array(lreFilterSchema),
  unitsRestrictions: z.array(lreRestrictionSchema),
  battles: z.array(lreBattleSchema),
  availableUnitIds: z.array(z.string()),
})

export const npcStatSchema = z.looseObject({
  abilityLevel: z.number(),
  damage: z.number(),
  armour: z.number(),
  health: z.number(),
  progressionIndex: z.number(),
  rank: z.number(),
  stars: z.number(),
})

// ---- record schemas --------------------------------------------------------------------------
export const characterViewSchema = z.looseObject({
  id: z.string(),
  name: z.string(),
  faction: z.string(),
  alliance: z.string(),
  health: z.number(),
  damage: z.number(),
  armour: z.number(),
  initialRarity: z.string(),
  meleeDamage: z.string(),
  meleeHits: z.number(),
  rangedDamage: z.string().nullish(),
  rangedHits: z.number().nullish(),
  rangeDistance: z.number().nullish(),
  movement: z.number(),
  traits: z.array(z.string()),
  activeAbilityNames: z.array(z.string()),
  passiveAbilityNames: z.array(z.string()),
  equipmentSlots: z.array(z.string()),
  icon: z.string(),
  roundIcon: z.string(),
  rankUpUpgrades: z.array(characterRankUpSchema),
  shardLocations: z.array(farmLocationSchema),
  eligibleEquipment: z.array(equipmentSlotSchema),
})

export const npcSchema = z.looseObject({
  id: z.string(),
  name: z.string(),
  meleeDamage: z.string(),
  meleeHits: z.number(),
  rangedDamage: z.string().nullish(),
  rangedHits: z.number().nullish(),
  distance: z.number().nullish(),
  movement: z.number(),
  traits: z.array(z.string()),
  activeAbilityDamage: z.array(z.string()),
  activeAbilities: z.array(z.string()),
  passiveAbilityDamage: z.array(z.string()),
  passiveAbilities: z.array(z.string()),
  icon: z.string().nullish(),
  stats: z.array(npcStatSchema),
})

export const mowSchema = z.looseObject({
  id: z.string(),
  name: z.string(),
  unitKind: z.string(),
  faction: z.string(),
  alliance: z.string(),
  icon: z.string(),
  roundIcon: z.string(),
  primaryAbility: mowAbilitySchema,
  secondaryAbility: mowAbilitySchema,
})

export const upgradeViewSchema = z.looseObject({
  id: z.string(),
  material: z.string(),
  snowprintId: z.string(),
  label: z.string(),
  rarity: z.string(),
  stat: z.string(),
  icon: z.string().nullish(),
  craftable: z.boolean(),
  recipe: z.array(upgradeRecipeIngredientSchema),
  farmLocations: z.array(farmLocationSchema),
  expanded: upgradeExpansionSchema.nullish(),
})

export const equipmentSchema = z.looseObject({
  id: z.string(),
  name: z.string(),
  rarity: z.string(),
  type: z.string(),
  abilityId: z.string().nullish(),
  isRelic: z.boolean(),
  isUniqueRelic: z.boolean(),
  allowedUnits: z.array(z.string()),
  allowedFactions: z.array(z.string()),
  levels: z.array(z.unknown()),
})

export const campaignBattleViewSchema = z.looseObject({
  id: z.string(),
  difficulty: z.string(),
  energyCost: z.number(),
  nodeNumber: z.number(),
  slots: z.number(),
  rewards: campaignRewardsViewSchema,
  enemyPower: z.number(),
  enemiesAlliances: z.array(z.string()),
  enemiesFactions: z.array(z.string()),
  enemiesTotal: z.number(),
  enemiesTypes: z.array(z.string()),
  detailedEnemyTypes: z.array(campaignDetailedEnemySchema),
})

export const campaignGroupViewSchema = z.looseObject({
  groupId: z.string(),
  faction: z.string(),
  releaseType: z.string(),
  coreCharacters: z.array(z.string()),
  difficulties: z.array(z.string()),
  battles: z.array(campaignBattleViewSchema),
})

export const lreViewSchema = z.looseObject({
  id: z.number(),
  unitSnowprintId: z.string(),
  name: z.string(),
  wikiLink: z.string(),
  eventStage: z.number(),
  finished: z.boolean(),
  nextEventDate: z.string().nullish(),
  nextEventDateUtc: z.string().nullish(),
  battlesCount: z.number(),
  constraintsCount: z.number(),
  regularMissions: z.array(z.string()),
  premiumMissions: z.array(z.string()),
  alpha: lreTrackViewSchema,
  beta: lreTrackViewSchema,
  gamma: lreTrackViewSchema,
  pointsMilestones: z.array(z.unknown()),
  chestsMilestones: z.array(z.unknown()),
  shardsPerChest: z.number(),
  progression: z.unknown(),
})

// ---- dataset payloads (the envelope `data`) --------------------------------------------------
export const mowDatasetSchema = z.looseObject({
  items: z.array(mowSchema),
  upgradeCosts: z.array(mowUpgradeCostSchema),
})

export const equipmentDatasetSchema = z.looseObject({
  items: z.array(equipmentSchema),
  upgradeCostsByRarity: z.array(equipmentUpgradeCostSchema),
})

export const datasetPayloadSchemas = {
  characters: z.array(characterViewSchema),
  npcs: z.array(npcSchema),
  mows: mowDatasetSchema,
  upgrades: z.array(upgradeViewSchema),
  equipment: equipmentDatasetSchema,
  "campaign-battles": z.array(campaignGroupViewSchema),
  lres: z.array(lreViewSchema),
} satisfies Record<CatalogDatasetKey, z.ZodType>

// ---- manifest + envelope ---------------------------------------------------------------------
export const manifestDatasetSchema = z.looseObject({
  key: z.string(),
  hash: z.string(),
  url: z.string(),
})

export const manifestSchema = z.looseObject({
  version: z.string(),
  schemaVersion: z.number(),
  gameVersion: z.string(),
  sourceHash: z.string(),
  datasets: z.array(manifestDatasetSchema),
})

// Envelope metadata; `data` is validated separately by the per-key payload schema above.
export const datasetEnvelopeMetaSchema = z.looseObject({
  version: z.string(),
  schemaVersion: z.number(),
  gameVersion: z.string(),
  sourceHash: z.string(),
  datasetKey: z.string(),
  datasetHash: z.string(),
  data: z.unknown(),
})

// Record (per-item) type for each dataset, after the wrapper datasets are unwrapped to their items.
export type CatalogRecordByKey = {
  characters: z.infer<typeof characterViewSchema>
  npcs: z.infer<typeof npcSchema>
  mows: z.infer<typeof mowSchema>
  upgrades: z.infer<typeof upgradeViewSchema>
  equipment: z.infer<typeof equipmentSchema>
  "campaign-battles": z.infer<typeof campaignGroupViewSchema>
  lres: z.infer<typeof lreViewSchema>
}

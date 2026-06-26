import { z } from "zod"

export const equipmentUpgradeLevelSchema = z.looseObject({
  goldCost: z.number(),
  salvageCost: z.number(),
  mythicSalvageCost: z.number(),
})

export const equipmentUpgradeCostSchema = z.looseObject({
  rarity: z.string(),
  levels: z.array(equipmentUpgradeLevelSchema),
})

// A single equipment level: the per-level stat block keyed by stat name (armor/hp, blockChance/
// blockDamage, critChance/critDamage, …). The stat keys vary by equipment type, so this is a string→
// number map rather than a fixed shape.
export const equipmentLevelSchema = z.looseObject({
  stats: z.record(z.string(), z.number()),
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
  levels: z.array(equipmentLevelSchema),
  // The matched per-rarity upgrade-cost ladder, inlined server-side (no shared extras table).
  upgradeLevels: z.array(equipmentUpgradeLevelSchema),
})

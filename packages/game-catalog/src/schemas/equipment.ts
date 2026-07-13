import { z } from "zod"
import {
  abilityIdSchema,
  equipmentIdSchema,
  factionIdSchema,
  Rarity,
  unitIdSchema,
} from "@workspace/game-domain"

const equipmentUpgradeLevelSchema = z.looseObject({
  goldCost: z.number(),
  salvageCost: z.number(),
  mythicSalvageCost: z.number(),
})

export const equipmentUpgradeCostSchema = z.looseObject({
  rarity: z.enum(Rarity),
  levels: z.array(equipmentUpgradeLevelSchema),
})

// A single equipment level: the per-level stat block keyed by stat name (armor/hp, blockChance/
// blockDamage, critChance/critDamage, …). The stat keys vary by equipment type, so this is a string→
// number map rather than a fixed shape.
const equipmentLevelSchema = z.looseObject({
  stats: z.record(z.string(), z.number()),
})

export const equipmentSchema = z.looseObject({
  id: equipmentIdSchema,
  name: z.string(),
  rarity: z.enum(Rarity),
  type: z.string(),
  abilityId: abilityIdSchema,
  isRelic: z.boolean(),
  isUniqueRelic: z.boolean(),
  allowedUnits: z.array(unitIdSchema),
  allowedFactions: z.array(factionIdSchema),
  levels: z.array(equipmentLevelSchema),
  // The matched per-rarity upgrade-cost ladder, inlined server-side (no shared extras table).
  upgradeLevels: z.array(equipmentUpgradeLevelSchema),
})

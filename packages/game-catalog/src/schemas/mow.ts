import { z } from "zod"

import { amountByRaritySchema } from "./shared"

export const mowAbilitySchema = z.looseObject({
  name: z.string(),
  recipes: z.array(z.array(z.string())),
})

export const mowSchema = z.looseObject({
  id: z.string(),
  name: z.string(),
  unitKind: z.string(),
  faction: z.string(),
  alliance: z.string(),
  primaryAbility: mowAbilitySchema,
  secondaryAbility: mowAbilitySchema,
})

export const mowUpgradeCostSchema = z.looseObject({
  // The ability level this rung raises a MoW to (the ladder starts at level 2).
  level: z.number(),
  gold: z.number(),
  salvage: z.number(),
  badges: amountByRaritySchema,
  forgeBadges: amountByRaritySchema.nullable(),
  components: z.number(),
})

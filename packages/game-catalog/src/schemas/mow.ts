import { z } from "zod"
import {
  Alliance,
  factionIdSchema,
  unitIdSchema,
  upgradeIdSchema,
} from "@workspace/game-domain"

import { amountByRaritySchema } from "./shared"

const mowAbilitySchema = z.looseObject({
  name: z.string(),
  recipes: z.array(z.array(upgradeIdSchema)),
})

export const mowSchema = z.looseObject({
  id: unitIdSchema,
  name: z.string(),
  unitKind: z.string(),
  faction: factionIdSchema,
  alliance: z.enum(Alliance),
  primaryAbility: mowAbilitySchema,
  secondaryAbility: mowAbilitySchema,
  // The MoW's mythic ability, unlocked at Mythic and levelled by blue stars (not by upgrade materials, so
  // no recipes). Omitted by a server that predates it.
  mythicAbility: z.looseObject({ name: z.string() }).optional(),
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

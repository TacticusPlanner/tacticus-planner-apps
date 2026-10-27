import { z } from "zod"

const secondsSchema = z.number().int().positive()

// One energy purchase of the game's stamina shop ladder, in game order: the energy and raid tickets
// it gives and its gem cost.
export const staminaShopTierSchema = z.looseObject({
  productId: z.string(),
  stamina: z.number().int().positive(),
  raidTickets: z.number().int().nonnegative(),
  gems: z.number().int().positive(),
})

// The game's `globalValues.json` constants (global-values dataset): a single record. Field names are
// the game's and times are seconds. Stamina is energy; waves stamina is Onslaught tokens;
// campaign-level stamina is the daily attempts of a limited (Elite) campaign battle. `traitVariables`
// holds the trait description constants by game key (numbers, plus a few strings).
export const globalValuesSchema = z.looseObject({
  maxStamina: z.number().int().positive(),
  staminaRegenerationTime: secondsSchema,
  staminaRegenerationAmount: z.number().int().positive(),
  wavesMaxStamina: z.number().int().positive(),
  wavesStaminaRegenerationTime: secondsSchema,
  wavesStaminaRegenerationAmount: z.number().int().positive(),
  campaignLevelMaxStamina: z.number().int().positive(),
  campaignLevelStaminaRegenerationTime: secondsSchema,
  campaignLevelStaminaRegenerationAmount: z.number().int().positive(),
  minUnitsNeededForBattle: z.number().int().positive(),
  maxUnitsPossibleForBattle: z.number().int().positive(),
  terrifyingBonus: z.number().int(),
  battleFatigueFleeChance: z.number().int(),
  battleFatigueFleeChanceOverkill: z.number().int(),
  traitVariables: z.record(z.string(), z.union([z.number(), z.string()])),
  staminaShopTiers: z.array(staminaShopTierSchema),
})

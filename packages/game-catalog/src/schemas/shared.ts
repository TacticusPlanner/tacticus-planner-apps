import { z } from "zod"

// Loose objects preserve unknown (server-added) fields and only fail on genuine shape/type breaks.
// `JsonElement` fields on the server are opaque here (stored as-is) → z.unknown().

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

export const amountByRaritySchema = z.looseObject({
  rarity: z.string(),
  amount: z.number(),
})

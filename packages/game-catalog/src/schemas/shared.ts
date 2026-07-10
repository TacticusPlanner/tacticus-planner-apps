import { z } from "zod"

import { Rank } from "../game-entities/rank"

// Loose objects preserve unknown (server-added) fields and only fail on genuine shape/type breaks.
// `JsonElement` fields on the server are opaque here (stored as-is) → z.unknown().

export const farmLocationSchema = z.looseObject({
  battleId: z.string(),
  type: z.string(),
  challenge: z.boolean(),
  guaranteed: z.boolean(),
  chanceId: z.string().nullable(),
  numerator: z.number().nullable(),
  denominator: z.number().nullable(),
  effectiveRate: z.number().nullable(),
})

export const equipmentSlotSchema = z.looseObject({
  slot: z.string(),
  equipmentIds: z.array(z.string()),
})

export const characterRankUpSchema = z.looseObject({
  rank: z.enum(Rank),
  upgradeIds: z.array(z.string()),
})

export const amountByRaritySchema = z.looseObject({
  rarity: z.string(),
  amount: z.number(),
})

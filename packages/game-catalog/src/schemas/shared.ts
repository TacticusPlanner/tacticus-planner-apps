import { z } from "zod"
import {
  battleIdSchema,
  equipmentIdSchema,
  Rank,
  Rarity,
  upgradeIdSchema,
} from "@workspace/game-domain"

// Loose objects preserve unknown (server-added) fields and only fail on genuine shape/type breaks.
// `JsonElement` fields on the server are opaque here (stored as-is) → z.unknown().

export const farmLocationSchema = z.looseObject({
  battleId: battleIdSchema,
  type: z.string(),
  challenge: z.boolean(),
  guaranteed: z.boolean(),
  chanceId: z.string().nullable(),
  numerator: z.number().nullable(),
  denominator: z.number().nullable(),
  effectiveRate: z.number().nullable(),
  // True only for a character's mythicShards_ reward locations (see the backend's ShardPrefixes) —
  // always false for an upgrade material's own farm locations, which have no mythic concept at all.
  isMythic: z.boolean(),
})

export const equipmentSlotSchema = z.looseObject({
  slot: z.string(),
  equipmentIds: z.array(equipmentIdSchema),
})

export const characterRankUpSchema = z.looseObject({
  rank: z.enum(Rank),
  upgradeIds: z.array(upgradeIdSchema),
})

export const amountByRaritySchema = z.looseObject({
  rarity: z.enum(Rarity),
  amount: z.number(),
})

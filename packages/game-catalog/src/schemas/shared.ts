import { z } from "zod"
import { Rank, Rarity } from "@workspace/game-domain"
import {
  battleIdSchema,
  equipmentIdSchema,
  upgradeIdSchema,
} from "@workspace/game-domain/schemas"

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
  // A property of the battle, not of this specific resource: the average of the battle's own
  // guaranteed gold reward. `.optional()` (not just `.nullable()`) so a payload from a server that
  // hasn't deployed this field yet still parses — see fix-daily-raid-location-recommendations design.md.
  expectedGold: z.number().nullable().optional(),
})

/**
 * Whether a character or MoW can summon: `none`; `optional` (only an active ability summons, so the player decides
 * whether it summons); `conditional` (a passive summons, but only while the player keeps up a condition they can
 * avoid, such as Tan Gi'da's active or Vynn repairing, so it is easy to summon by accident); `forced` (a passive
 * ability summons on its own, so the player cannot prevent it).
 */
export const unitSummons = [
  "none",
  "optional",
  "conditional",
  "forced",
] as const
export type UnitSummons = (typeof unitSummons)[number]

// Defaults to `none` for a server that predates the field.
export const unitSummonsSchema = z.enum(unitSummons).default("none")

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

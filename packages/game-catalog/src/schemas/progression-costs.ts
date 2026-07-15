import { z } from "zod"
import { progressionOrder, Rarity } from "@workspace/game-domain"

// The shared per-progression-step ascension cost ladder (plan §16 phase 7): the shards/mythic
// shards/orbs needed to reach a given step of `progressionOrder` from the previous one.
export const ascensionCostSchema = z.looseObject({
  progression: z.enum(progressionOrder),
  shards: z.number(),
  mythicShards: z.number(),
  orbs: z.number(),
  orbRarity: z.enum(Rarity).nullable(),
})

// The shard cost to unlock a character of a given starting rarity.
export const unlockShardCostSchema = z.looseObject({
  rarity: z.enum(Rarity),
  shards: z.number(),
})

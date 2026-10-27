import { z } from "zod"

const countSchema = z.number().int().nonnegative()

// One task of a mission: the game's task name, its target and its parameters (a faction trait, a
// game mode, a damage profile, a faction or a hero id, by the game's parameter name).
const hreMissionTaskSchema = z.looseObject({
  name: z.string(),
  target: z.number().int().positive(),
  parameters: z.record(z.string(), z.string()),
})

// One mission of the chain, in chain order (`index` from 1); the last one is the Bonus mission.
const hreMissionSchema = z.looseObject({
  index: z.number().int().positive(),
  id: z.string(),
  bonus: z.boolean(),
  currency: countSchema,
  rewards: z.array(z.string()),
  tasks: z.array(hreMissionTaskSchema).length(2),
})

// A leaderboard position bracket starts at `position` (0 is first place) and runs to the next one.
const hrePhaseChestSchema = z.looseObject({
  position: countSchema,
  chestId: z.string(),
  currency: countSchema,
  shards: countSchema,
})

const hreLeaderboardSchema = z.looseObject({
  id: z.string(),
  dailyRewards: z.array(
    z.looseObject({ position: countSchema, currency: countSchema })
  ),
  // The phase chests in phase order; the last phase has no end offset (it ends with the event).
  phases: z.array(
    z.looseObject({
      endOffsetDays: z.number().int().nullable(),
      tiers: z.array(hrePhaseChestSchema),
    })
  ),
})

// One chest of the event's chest shop, in shop order: its event currency cost and shard range.
const hreChestSchema = z.looseObject({
  chestId: z.string(),
  cost: z.number().int().positive(),
  minShards: countSchema,
  maxShards: countSchema,
})

// One Hero Release Event as the game defines it (`hre` dataset): its unlockable hero and featured
// faction, the points milestones (event currency each), the mission chain, the leaderboard's daily
// currency and phase chests, the chest shop and the Oh So Close offer pricing.
export const hreSchema = z.looseObject({
  id: z.string(),
  heroId: z.string(),
  baseRarity: z.string(),
  maxRarity: z.string(),
  featuredFaction: z.string(),
  gameModes: z.array(z.string()),
  scorePoints: z.looseObject({}),
  milestones: z.array(
    z.looseObject({
      scorePoints: z.number().int().positive(),
      currency: countSchema,
    })
  ),
  missions: z.array(hreMissionSchema),
  leaderboard: hreLeaderboardSchema,
  chestShop: z.array(hreChestSchema),
  ohSoCloseOffer: z.looseObject({}),
})

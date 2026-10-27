import { z } from "zod"
import { factionIdSchema, unitIdSchema } from "@workspace/game-domain/schemas"

const lreFilterSchema = z.looseObject({
  kind: z.string(),
  target: z.string(),
  exclude: z.boolean(),
})

const lreRestrictionSchema = z.looseObject({
  name: z.string(),
  points: z.number(),
  index: z.number(),
  filter: lreFilterSchema,
})

// One event mission as a typed requirement, parsed server side from its raw text (`text`). Parameters
// the kind does not use are null; "Defeat N Daemon enemies" is `defeatFaction` with a `trait`.
const lreMissionSchema = z.looseObject({
  index: z.number(),
  kind: z.string(),
  count: z.number(),
  faction: z.string().nullable(),
  alliance: z.string().nullable(),
  damageType: z.string().nullable(),
  trait: z.string().nullable(),
  text: z.string(),
})

const lreTrackEnemiesSchema = z.looseObject({
  label: z.string(),
  link: z.string(),
})

export const lreEnemySchema = z.looseObject({
  id: unitIdSchema,
  // 1-based position of the enemy's row in its npc's served `stats` ladder (V1's N in "{npcId}:{N}"),
  // not a star count. Served as is: a few boss entries point past the end of their ladder.
  ladderIndex: z.number(),
  count: z.number(),
})

export const lreWaveSchema = z.looseObject({
  round: z.number(),
  power: z.number(),
  enemies: z.array(lreEnemySchema),
})

export const lreBattleSchema = z.looseObject({
  mapId: z.string(),
  number: z.number(),
  power: z.number(),
  tier: z.number(),
  disallowedFactions: z.array(factionIdSchema),
  waves: z.array(lreWaveSchema),
})

// A point-reward milestone: the cumulative points to reach it and the engram payout it grants.
const lrePointsMilestoneSchema = z.looseObject({
  milestone: z.number(),
  cumulativePoints: z.number(),
  engramPayout: z.number(),
})

// A chest rung: the chest level and the engram cost to open it.
const lreChestsMilestoneSchema = z.looseObject({
  chestLevel: z.number(),
  engramCost: z.number(),
})

// Shards needed for each step of the event unit's ascension (incremental, not cumulative).
const lreProgressionSchema = z.looseObject({
  unlock: z.number(),
  fourStars: z.number(),
  fiveStars: z.number(),
  blueStar: z.number(),
  mythic: z.number(),
  twoBlueStars: z.number(),
})

// The event's own reward ladder: points milestones, chest costs, the unit's ascension steps and the
// shards each chest awards. Ladders differ between events, so each `lres` record carries its own.
export const lreRewardsSchema = z.looseObject({
  pointsMilestones: z.array(lrePointsMilestoneSchema),
  chestsMilestones: z.array(lreChestsMilestoneSchema),
  progression: lreProgressionSchema,
  shardsPerChest: z.number(),
})

export const lreTrackViewSchema = z.looseObject({
  name: z.string(),
  enemies: lreTrackEnemiesSchema,
  killPoints: z.number(),
  battlesPoints: z.array(z.number()),
  defeatAll: z.array(z.number()),
  allowedUnitsFilter: z.array(lreFilterSchema),
  unitsRestrictions: z.array(lreRestrictionSchema),
  // Ids of this track's battles in the lre-battles dataset (ordered); the battle bodies live there.
  battleIds: z.array(z.string()),
  availableUnitIds: z.array(unitIdSchema),
})

// The game's "Oh So Close" offer for an event hero: the blackstone price of the shards still missing,
// `base` plus `multiplier` per shard, for its unlock and for each later ascension step.
const ohSoClosePriceSchema = z.looseObject({
  base: z.number().int().nonnegative(),
  multiplier: z.number().int().nonnegative(),
})

const ohSoCloseOfferSchema = z.looseObject({
  unlock: ohSoClosePriceSchema,
  ascension: ohSoClosePriceSchema,
})

// The event's token bank (the game's stamina): it starts at `start`, holds at most `max` and regains
// `regenAmount` every `regenSeconds` while below `max`; `dailyRefreshes` is the paid refills a day allows.
const lreTokensSchema = z.looseObject({
  start: z.number().int().nonnegative(),
  max: z.number().int().positive(),
  regenSeconds: z.number().int().positive(),
  regenAmount: z.number().int().positive(),
  dailyRefreshes: z.number().int().nonnegative(),
})

export const lreViewSchema = z.looseObject({
  // The event's unit snowprint id (e.g. "emperLucius") — the stable string id of the LRE.
  id: z.string(),
  name: z.string(),
  // The announced run starts in ISO 8601 UTC, indexed by run: element 0 starts run 1, element 1
  // run 2, element 2 run 3 (0 to 3 entries, no gaps). The client derives the current, ended and
  // next runs, and whether the event is finished, from this array and the clock; the server sends
  // no run number or finished flag.
  eventStageStartDatesUtc: z.array(z.string()),
  battlesCount: z.number(),
  constraintsCount: z.number(),
  regularMissions: z.array(lreMissionSchema),
  premiumMissions: z.array(lreMissionSchema),
  rewards: lreRewardsSchema,
  alpha: lreTrackViewSchema,
  beta: lreTrackViewSchema,
  gamma: lreTrackViewSchema,
  tokens: lreTokensSchema,
  // How many runs the event has (the game's heroEventMaxRuns).
  maxRuns: z.number().int().positive(),
  ohSoCloseOffer: ohSoCloseOfferSchema,
})

// A served LRE battle (lre-battles dataset): the battle body plus its composite id and owning event/track,
// so the bulky wave data is fetched independently of the lightweight lres list.
export const lreBattleViewSchema = z.looseObject({
  // The composite id "{lreId}-{track}-{number}" that a track's battleIds resolve to.
  id: z.string(),
  lreId: z.string(),
  track: z.string(),
  mapId: z.string(),
  number: z.number(),
  power: z.number(),
  tier: z.number(),
  disallowedFactions: z.array(factionIdSchema),
  waves: z.array(lreWaveSchema),
})

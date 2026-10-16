import { z } from "zod"
import { factionIdSchema, unitIdSchema } from "@workspace/game-domain"

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

const lreTrackEnemiesSchema = z.looseObject({
  label: z.string(),
  link: z.string(),
})

export const lreEnemySchema = z.looseObject({
  id: unitIdSchema,
  stars: z.number(),
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
  regularMissions: z.array(z.string()),
  premiumMissions: z.array(z.string()),
  rewards: lreRewardsSchema,
  alpha: lreTrackViewSchema,
  beta: lreTrackViewSchema,
  gamma: lreTrackViewSchema,
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

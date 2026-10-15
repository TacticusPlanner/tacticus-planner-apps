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

// Points awarded for reaching each character progression tier during the event.
const lreProgressionSchema = z.looseObject({
  unlock: z.number(),
  fourStars: z.number(),
  fiveStars: z.number(),
  blueStar: z.number(),
  mythic: z.number(),
  twoBlueStars: z.number(),
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
  finished: z.boolean(),
  // Per-event-stage start dates in ISO 8601 UTC; the client derives the current stage from this array.
  eventStageStartDatesUtc: z.array(z.string()),
  battlesCount: z.number(),
  constraintsCount: z.number(),
  regularMissions: z.array(z.string()),
  premiumMissions: z.array(z.string()),
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

// The shared, event-independent LRE reward ladder (lre-common dataset): a single record.
export const lreCommonSchema = z.looseObject({
  id: z.string(),
  pointsMilestones: z.array(lrePointsMilestoneSchema),
  chestsMilestones: z.array(lreChestsMilestoneSchema),
  progression: lreProgressionSchema,
  shardsPerChest: z.number(),
})

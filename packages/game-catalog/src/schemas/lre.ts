import { z } from "zod"

export const lreFilterSchema = z.looseObject({
  kind: z.string(),
  target: z.string(),
  exclude: z.boolean(),
})

export const lreRestrictionSchema = z.looseObject({
  name: z.string(),
  points: z.number(),
  iconId: z.string().nullish(),
  index: z.number(),
  filter: lreFilterSchema,
})

export const lreTrackEnemiesSchema = z.looseObject({
  label: z.string(),
  link: z.string(),
})

export const lreEnemySchema = z.looseObject({
  id: z.string(),
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
  disallowedFactions: z.array(z.string()),
  waves: z.array(lreWaveSchema),
})

export const lreTrackViewSchema = z.looseObject({
  name: z.string(),
  enemies: lreTrackEnemiesSchema,
  killPoints: z.number(),
  battlesPoints: z.array(z.number()),
  defeatAll: z.array(z.number()),
  allowedUnitsFilter: z.array(lreFilterSchema),
  unitsRestrictions: z.array(lreRestrictionSchema),
  battles: z.array(lreBattleSchema),
  availableUnitIds: z.array(z.string()),
})

export const lreViewSchema = z.looseObject({
  // The event's unit snowprint id (e.g. "emperLucius") — the stable string id of the LRE.
  id: z.string(),
  name: z.string(),
  wikiLink: z.string(),
  eventStage: z.number(),
  finished: z.boolean(),
  nextEventDate: z.string().nullish(),
  nextEventDateUtc: z.string().nullish(),
  battlesCount: z.number(),
  constraintsCount: z.number(),
  regularMissions: z.array(z.string()),
  premiumMissions: z.array(z.string()),
  alpha: lreTrackViewSchema,
  beta: lreTrackViewSchema,
  gamma: lreTrackViewSchema,
  pointsMilestones: z.array(z.unknown()),
  chestsMilestones: z.array(z.unknown()),
  shardsPerChest: z.number(),
  progression: z.unknown(),
})

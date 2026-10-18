import { z } from "zod"

// Loose objects preserve unknown (server-added) fields and only fail on genuine shape/type breaks,
// matching the rest of this package's schemas (see shared.ts).

export const eventRecurrenceSchema = z.looseObject({
  kind: z.enum(["Fixed", "None"]),
  // Present only when kind is "Fixed" — see design.md in the integrate-game-events-calendar change.
  intervalDays: z.number().int().positive().nullable(),
  durationDays: z.number().int().positive().nullable(),
  anchorUtc: z.string().nullable(),
})

// A reusable event mechanic. No display name or icon — the client resolves both from `id` via i18n and
// id-based icon mapping (see @workspace/game-catalog's naming-conventions skill). `config` is
// mechanic-specific data whose shape varies per `type` and is not interpreted by this package.
export const eventDefinitionSchema = z.looseObject({
  id: z.string().min(1),
  type: z.string(),
  recurrence: eventRecurrenceSchema,
  requiredParameters: z.array(z.string()),
  config: z.unknown().nullable().optional(),
})

// One calendar entry: either an authored occurrence (confirmed, occurrenceId set) or a server-projected
// placeholder (confirmed: false, occurrenceId null). No display text — same id-based resolution as above,
// using `definitionId` and `parameters`. Kept as a plain object (not yet refined) so `.extend()` below can
// still build on it — the time-window refinement is applied to each exported schema separately.
const eventsCalendarEntryObjectSchema = z.looseObject({
  occurrenceId: z.string().nullable(),
  definitionId: z.string(),
  confirmed: z.boolean(),
  startUtc: z.string(),
  endUtc: z.string(),
  parameters: z.record(z.string(), z.unknown()).nullable(),
})

// A backend validation gap this schema also guards client-side: an occurrence whose startUtc isn't
// strictly before its endUtc would otherwise silently disappear from every active/upcoming query instead
// of failing loudly.
function hasPositiveTimeWindow(entry: {
  startUtc: string
  endUtc: string
}): boolean {
  return Date.parse(entry.startUtc) < Date.parse(entry.endUtc)
}

export const eventsCalendarEntrySchema = eventsCalendarEntryObjectSchema.refine(
  hasPositiveTimeWindow,
  { message: "startUtc must be strictly before endUtc" }
)

// The served events-calendar payload is date-indexed (ISO date string -> entries), not a plain array like
// every other dataset — the one exception in this package's "every payload is an array" convention.
export const eventsCalendarPayloadSchema = z.record(
  z.string(),
  z.array(eventsCalendarEntrySchema)
)

// The flattened storage-row shape used once events-calendar is split into individual IndexedDB rows: the
// served payload's object key (`date`) is injected as a real field so each entry has a place to carry it
// once flattened (see game-catalog.mapper.ts's `byCalendarDate`).
export const eventsCalendarRowSchema = eventsCalendarEntryObjectSchema
  .extend({ date: z.string() })
  .refine(hasPositiveTimeWindow, {
    message: "startUtc must be strictly before endUtc",
  })

// --- Home Screen Event scoring (`config.hse` on a HomeScreenEvent definition) --------------------
// Served by the API's add-hse-points-projection change: variants with reward tiers, point trackers and
// bonus modifiers, all data and no display text (the client builds its own copy from these values).
// `config` itself stays `unknown` on the definition so a scoring shape change can never fail the whole
// catalog sync; consumers read it through `parseHseConfig` (hse-scoring.ts).

/** Passes a value when it is not in `disallowed` and, if `allowed` is set, is in `allowed`. */
export const hseRestrictionSchema = z.looseObject({
  allowed: z.array(z.string()).nullable(),
  disallowed: z.array(z.string()).nullable(),
})

/** `tags` match a unit's traits or its alliance; `factionIds` its faction; `unitIds` the unit itself. */
export const hseUnitFilterSchema = z.looseObject({
  tags: hseRestrictionSchema.nullable(),
  factionIds: hseRestrictionSchema.nullable(),
  unitIds: z.array(z.string()).nullable(),
})

export const hseMilestoneSchema = z.looseObject({
  requiredPoints: z.number().int().positive(),
  rewardId: z.string().min(1),
  quantity: z.number().int().positive(),
})

/** The endless step after the last milestone: `points` per repeat, at most `cap` repeats (null: no cap). */
export const hseRepeatSchema = z.looseObject({
  points: z.number().int().positive(),
  rewardId: z.string().min(1),
  quantity: z.number().int().positive(),
  cap: z.number().int().positive().nullable(),
})

const hseTierKeys = ["High", "Mid", "Low", "Default"] as const

export const hseTierSchema = z.looseObject({
  tier: z.enum(hseTierKeys),
  /** Cumulative and strictly increasing (the server validates it). */
  milestones: z.array(hseMilestoneSchema).min(1),
  repeat: hseRepeatSchema.nullable(),
})

/** `kind` stays an open string: a tracker kind this client does not know is kept and simply ignored. */
export const hseTrackerSchema = z.looseObject({
  kind: z.string().min(1),
  points: z.number().int().positive(),
  pointsByRarity: z.record(z.string(), z.number()).nullable(),
  gameModes: hseRestrictionSchema.nullable(),
  enemy: hseUnitFilterSchema.nullable(),
  player: hseUnitFilterSchema.nullable(),
})

const hseModifierTargetShape = {
  gameModes: hseRestrictionSchema.nullable(),
  player: hseUnitFilterSchema.nullable(),
}

/** Exactly one of `multiplier` (flat) and `multiplierByRarity` is set; the other is null or omitted. */
export const hseUnitXpModifierSchema = z.looseObject({
  kind: z.literal("UnitXp"),
  multiplier: z.number().positive().nullish(),
  multiplierByRarity: z.record(z.string(), z.number().positive()).nullish(),
  sameFactionTeam: z.boolean(),
  ...hseModifierTargetShape,
})

export const hseStatBoostModifierSchema = z.looseObject({
  kind: z.literal("StatBoost"),
  healthPct: z.number().int(),
  damagePct: z.number().int(),
  armourPct: z.number().int(),
  ...hseModifierTargetShape,
})

const hseModifierKinds = new Set(["UnitXp", "StatBoost"])

/** Known modifier kinds are validated; a kind this client does not know is dropped, not a failure. */
const hseModifiersSchema = z.preprocess(
  (value) =>
    Array.isArray(value)
      ? value.filter(
          (item: unknown) =>
            typeof item === "object" &&
            item !== null &&
            hseModifierKinds.has(String((item as { kind?: unknown }).kind))
        )
      : value,
  z.array(
    z.discriminatedUnion("kind", [
      hseUnitXpModifierSchema,
      hseStatBoostModifierSchema,
    ])
  )
)

export const hseVariantSchema = z.looseObject({
  variantKey: z.string().min(1),
  /** `Global`: the milestones count every player's points (a community event). */
  scope: z.enum(["Personal", "Global"]),
  tiers: z.array(hseTierSchema).min(1),
  trackers: z.array(hseTrackerSchema),
  modifiers: hseModifiersSchema,
})

export const hseConfigSchema = z.looseObject({
  variants: z.array(hseVariantSchema).min(1),
})

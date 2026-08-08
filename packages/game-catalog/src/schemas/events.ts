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
// using `definitionId` and `parameters`.
export const eventsCalendarEntrySchema = z.looseObject({
  occurrenceId: z.string().nullable(),
  definitionId: z.string(),
  confirmed: z.boolean(),
  startUtc: z.string(),
  endUtc: z.string(),
  parameters: z.record(z.string(), z.unknown()).nullable(),
})

// The served events-calendar payload is date-indexed (ISO date string -> entries), not a plain array like
// every other dataset — the one exception in this package's "every payload is an array" convention.
export const eventsCalendarPayloadSchema = z.record(
  z.string(),
  z.array(eventsCalendarEntrySchema)
)

// The flattened storage-row shape used once events-calendar is split into individual IndexedDB rows: the
// served payload's object key (`date`) is injected as a real field so each entry has a place to carry it
// once flattened (see game-catalog.mapper.ts's `byCalendarDate`).
export const eventsCalendarRowSchema = eventsCalendarEntrySchema.extend({
  date: z.string(),
})

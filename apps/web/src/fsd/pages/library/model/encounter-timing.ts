import type {
  EventsCalendarStorageModel,
  NpcEncounterSource,
} from "@workspace/game-catalog"

import { incursionWindow } from "@/entities/incursion"

/**
 * When an encounter can be played, for the encounters section:
 * - `always`: permanent content (campaigns, Onslaught)
 * - `rotating`: comes and goes, but no schedule names it (Campaign Event, Guild Raid, Survival)
 * - `running` / `next` / `none`: the calendar's answer for a Legendary Event, Quest Event or Incursion
 */
export type EncounterTiming =
  | { kind: "always" }
  | { kind: "rotating" }
  | { kind: "running" }
  | { kind: "next"; startMs: number }
  | { kind: "none" }

// The calendar definition of a scheduled source and the occurrence parameter that names its group.
const SCHEDULED: Partial<
  Record<NpcEncounterSource, { definitionId: string; parameter: string }>
> = {
  legendaryEvent: {
    definitionId: "legendary-event",
    parameter: "featuredCharacterId",
  },
  questEvent: { definitionId: "quest", parameter: "featuredCharacterId" },
}

// An Incursion window opens every MoW's Incursion, so it is read as the Incursions page reads it; its
// `featuredMowId` only marks a debut.
function incursionTiming(
  calendar: readonly EventsCalendarStorageModel[],
  nowMs: number
): EncounterTiming {
  const window = incursionWindow(calendar, nowMs)
  if (!window) return { kind: "none" }
  return window.status === "live"
    ? { kind: "running" }
    : { kind: "next", startMs: window.startMs }
}

const ALWAYS: ReadonlySet<NpcEncounterSource> = new Set([
  "campaign",
  "onslaught",
])

/**
 * The timing of one encounter group. `calendar` is the stored `events-calendar` rows, or `null` while that
 * dataset is loading, absent or failed — then a scheduled source has no answer (`null`) rather than "none".
 * A calendar entry matches when its `definitionId` is the source's and, for Legendary and Quest Events, its
 * `featuredCharacterId` equals `groupId` (a projected placeholder carries no parameters, so it never names
 * one); every incursion entry matches every Incursion group.
 */
export function encounterTiming(
  source: NpcEncounterSource,
  groupId: string,
  calendar: readonly EventsCalendarStorageModel[] | null,
  nowMs: number
): EncounterTiming | null {
  if (ALWAYS.has(source)) return { kind: "always" }
  if (source === "incursion") {
    return calendar ? incursionTiming(calendar, nowMs) : null
  }
  const scheduled = SCHEDULED[source]
  if (!scheduled) return { kind: "rotating" }
  if (!calendar) return null

  let next: number | undefined
  for (const entry of calendar) {
    if (entry.definitionId !== scheduled.definitionId) continue
    if (entry.parameters?.[scheduled.parameter] !== groupId) continue
    const start = Date.parse(entry.startUtc)
    const end = Date.parse(entry.endUtc)
    if (start <= nowMs && nowMs < end) {
      return { kind: "running" }
    }
    if (start > nowMs && (next === undefined || start < next)) {
      next = start
    }
  }
  return next === undefined ? { kind: "none" } : { kind: "next", startMs: next }
}

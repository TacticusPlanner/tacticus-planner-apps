import type {
  EventsCalendarStorageModel,
  NpcEncounterSource,
} from "@workspace/game-catalog"

/**
 * When an encounter can be played, for the encounters section:
 * - `always`: permanent content (campaigns, Onslaught)
 * - `rotating`: comes and goes, but no schedule names it (Campaign Event, Guild Raid, Survival)
 * - `running` / `next` / `none`: the calendar's answer for a Legendary Event, Quest Event or Incursion
 */
export type EncounterTiming =
  | { kind: "always" }
  | { kind: "rotating" }
  | { kind: "running"; endUtc: string }
  | { kind: "next"; startUtc: string }
  | { kind: "none" }

// The calendar definition of a scheduled source and the occurrence parameter that names its group. An
// Incursion window opens every MoW's Incursion (as the Incursions page reads it); its `featuredMowId`
// only marks a debut, so an incursion entry is not narrowed by group.
const SCHEDULED: Partial<
  Record<NpcEncounterSource, { definitionId: string; parameter?: string }>
> = {
  legendaryEvent: {
    definitionId: "legendary-event",
    parameter: "featuredCharacterId",
  },
  questEvent: { definitionId: "quest", parameter: "featuredCharacterId" },
  incursion: { definitionId: "incursion" },
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
  const scheduled = SCHEDULED[source]
  if (!scheduled) return { kind: "rotating" }
  if (!calendar) return null

  let next: string | undefined
  for (const entry of calendar) {
    if (entry.definitionId !== scheduled.definitionId) continue
    if (
      scheduled.parameter &&
      entry.parameters?.[scheduled.parameter] !== groupId
    ) {
      continue
    }
    const start = Date.parse(entry.startUtc)
    const end = Date.parse(entry.endUtc)
    if (start <= nowMs && nowMs < end) {
      return { kind: "running", endUtc: entry.endUtc }
    }
    if (start > nowMs && (!next || start < Date.parse(next))) {
      next = entry.startUtc
    }
  }
  return next ? { kind: "next", startUtc: next } : { kind: "none" }
}

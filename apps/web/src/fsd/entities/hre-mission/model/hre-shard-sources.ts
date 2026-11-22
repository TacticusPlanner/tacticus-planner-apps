import { listHreInstances } from "./hre-instance"
import type { HreCalendarEntry } from "./hre-instance"

/** The Hero Release Event a featured hero's shards come from: the running one, else the next. */
export type HreShardSource = {
  characterId: string
  status: "running" | "upcoming"
  /** The instance's key, for a link to that event on the HRE tab. */
  eventKey: string
  startUtc: string
  endUtc: string
}

/**
 * Each featured hero's running or upcoming Hero Release Event, by character id. A running event
 * wins over an upcoming one; among upcoming ones the earliest wins. Past events are left out, so
 * once a hero's HRE ends (and no other is scheduled) the hero is planned like any other.
 */
export function hreShardSources(
  entries: readonly HreCalendarEntry[],
  definitionsById: ReadonlyMap<string, { type: string }>,
  nowMs: number
): Map<string, HreShardSource> {
  const sources = new Map<string, HreShardSource>()
  // Ordered by start, so the first upcoming instance seen for a hero is its earliest.
  for (const instance of listHreInstances(entries, definitionsById, nowMs)) {
    const characterId = instance.featuredCharacterId
    if (!characterId || instance.status === "past") continue
    if (instance.status === "upcoming" && sources.has(characterId)) continue
    sources.set(characterId, {
      characterId,
      status: instance.status,
      eventKey: instance.key,
      startUtc: instance.entry.startUtc,
      endUtc: instance.entry.endUtc,
    })
  }
  return sources
}

/** The next instant after `nowMs` at which an HRE starts or ends, or null when none is scheduled. */
export function nextHreBoundaryMs(
  entries: readonly HreCalendarEntry[],
  definitionsById: ReadonlyMap<string, { type: string }>,
  nowMs: number
): number | null {
  let next: number | null = null
  for (const { entry } of listHreInstances(entries, definitionsById, nowMs)) {
    for (const boundary of [
      Date.parse(entry.startUtc),
      Date.parse(entry.endUtc),
    ])
      if (boundary > nowMs && (next === null || boundary < next))
        next = boundary
  }
  return next
}

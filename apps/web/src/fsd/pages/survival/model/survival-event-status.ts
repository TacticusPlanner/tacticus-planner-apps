import type { SurvivalEvent, SurvivalEventStatus } from "./survival-event"

/** Running between its start and (exclusive) end, upcoming before, past after; undated without dates. */
export function survivalEventStatus(
  event: Pick<SurvivalEvent, "startUtc" | "endUtc">,
  now: number
): SurvivalEventStatus {
  if (event.startUtc === null || event.endUtc === null) return "undated"
  if (now < Date.parse(event.startUtc)) return "upcoming"
  return now < Date.parse(event.endUtc) ? "running" : "past"
}

/** Dated events by start, then undated ones by id. */
export function compareSurvivalEvents(
  a: Pick<SurvivalEvent, "id" | "startUtc">,
  b: Pick<SurvivalEvent, "id" | "startUtc">
): number {
  if (a.startUtc !== null && b.startUtc !== null) {
    return Date.parse(a.startUtc) - Date.parse(b.startUtc)
  }
  if (a.startUtc !== null) return -1
  if (b.startUtc !== null) return 1
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0
}

/**
 * The event a page opens on: the running one, else the next dated one, else the newest past one, else
 * the first undated one. Null for an empty list.
 */
export function defaultSurvivalEventId(
  events: readonly Pick<SurvivalEvent, "id" | "startUtc" | "endUtc">[],
  now: number
): string | null {
  const sorted = events.toSorted(compareSurvivalEvents)
  const withStatus = sorted.map((event) => ({
    event,
    status: survivalEventStatus(event, now),
  }))
  const pick = (status: SurvivalEventStatus) =>
    withStatus.find((entry) => entry.status === status)?.event.id
  return (
    pick("running") ??
    pick("upcoming") ??
    withStatus.findLast((entry) => entry.status === "past")?.event.id ??
    pick("undated") ??
    null
  )
}

/** The first event start or end after `now`, when an event's status next changes; null for none. */
export function nextSurvivalBoundary(
  events: readonly Pick<SurvivalEvent, "startUtc" | "endUtc">[],
  now: number
): number | null {
  let next: number | null = null
  for (const event of events) {
    for (const date of [event.startUtc, event.endUtc]) {
      const at = date === null ? Number.NaN : Date.parse(date)
      if (at > now && (next === null || at < next)) next = at
    }
  }
  return next
}

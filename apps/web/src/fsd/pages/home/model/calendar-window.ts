/** One calendar event running now (with its end) or the next one (with its start). */
export type CalendarWindow = {
  status: "live" | "upcoming"
  startMs: number
  endMs: number
}

/**
 * The window of the calendar event `definitionId` around `nowMs`: the one running now, else the
 * next to start; `null` when the calendar has neither.
 */
export function calendarWindow(
  entries: readonly CalendarWindowEntry[],
  definitionId: string,
  nowMs: number
): CalendarWindow | null {
  const found = calendarWindowEntry(entries, definitionId, nowMs)
  return found && found.window
}

type CalendarWindowEntry = {
  definitionId: string
  startUtc: string
  endUtc: string
}

/** {@link calendarWindow} with the calendar entry it was read from, for its parameters. */
export function calendarWindowEntry<TEntry extends CalendarWindowEntry>(
  entries: readonly TEntry[],
  definitionId: string,
  nowMs: number
): { window: CalendarWindow; entry: TEntry } | null {
  let next: { startMs: number; endMs: number; entry: TEntry } | null = null
  for (const entry of entries) {
    if (entry.definitionId !== definitionId) continue
    const startMs = Date.parse(entry.startUtc)
    const endMs = Date.parse(entry.endUtc)
    if (Number.isNaN(startMs) || Number.isNaN(endMs)) continue
    if (startMs <= nowMs && nowMs < endMs) {
      return { window: { status: "live", startMs, endMs }, entry }
    }
    if (startMs > nowMs && (!next || startMs < next.startMs)) {
      next = { startMs, endMs, entry }
    }
  }
  return next
    ? {
        window: {
          status: "upcoming",
          startMs: next.startMs,
          endMs: next.endMs,
        },
        entry: next.entry,
      }
    : null
}

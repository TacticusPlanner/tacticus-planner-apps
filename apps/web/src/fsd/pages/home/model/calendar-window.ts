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
  entries: readonly {
    definitionId: string
    startUtc: string
    endUtc: string
  }[],
  definitionId: string,
  nowMs: number
): CalendarWindow | null {
  let next: { startMs: number; endMs: number } | null = null
  for (const entry of entries) {
    if (entry.definitionId !== definitionId) continue
    const startMs = Date.parse(entry.startUtc)
    const endMs = Date.parse(entry.endUtc)
    if (Number.isNaN(startMs) || Number.isNaN(endMs)) continue
    if (startMs <= nowMs && nowMs < endMs) {
      return { status: "live", startMs, endMs }
    }
    if (startMs > nowMs && (!next || startMs < next.startMs)) {
      next = { startMs, endMs }
    }
  }
  return next ? { status: "upcoming", ...next } : null
}

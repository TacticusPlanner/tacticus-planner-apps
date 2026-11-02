/** The Incursion event definition's id in the game-events calendar. */
const INCURSION_DEFINITION_ID = "incursion"

/** The Incursion event running now (with its end) or the next one (with its start). */
export type IncursionWindow =
  | { status: "live"; startMs: number; endMs: number }
  | { status: "upcoming"; startMs: number; endMs: number }

/**
 * The Incursion window around `nowMs` from calendar entries: the one running now, else the next to
 * start; `null` when the calendar has neither. A multi-day entry repeats per date, which is harmless.
 */
export function incursionWindow(
  entries: readonly {
    definitionId: string
    startUtc: string
    endUtc: string
  }[],
  nowMs: number
): IncursionWindow | null {
  let next: { startMs: number; endMs: number } | null = null
  for (const entry of entries) {
    if (entry.definitionId !== INCURSION_DEFINITION_ID) continue
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

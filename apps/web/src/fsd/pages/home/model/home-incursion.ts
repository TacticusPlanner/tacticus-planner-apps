/** The Incursion a Home tile features: its newest MoW, and whether that MoW has yet to arrive. */
export type HomeIncursion = { mowId: string; arrivesMs: number | null }

/**
 * The newest MoW's Incursion: the latest to arrive when one is scheduled, else the latest out
 * (its `arrivesMs` is then `null`). `null` for an empty catalog.
 */
export function homeIncursion(
  incursions: readonly { mowId: string; availableFromUtc: string }[],
  nowMs: number
): HomeIncursion | null {
  let newest: { mowId: string; startMs: number } | null = null
  for (const incursion of incursions) {
    const startMs = Date.parse(incursion.availableFromUtc)
    if (Number.isNaN(startMs)) continue
    if (!newest || startMs > newest.startMs) {
      newest = { mowId: incursion.mowId, startMs }
    }
  }
  if (!newest) return null
  return {
    mowId: newest.mowId,
    arrivesMs: newest.startMs > nowMs ? newest.startMs : null,
  }
}

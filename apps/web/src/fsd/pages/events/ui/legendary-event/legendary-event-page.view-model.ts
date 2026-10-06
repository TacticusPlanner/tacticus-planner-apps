import {
  nextPointsMilestone,
  type LegendaryEvent,
  type LegendaryEventCommon,
  type LegendaryEventLaneId,
  type LegendaryEventLifecycle,
  type LegendaryEventProgress,
  type NextPointsMilestone,
  type ReadState,
} from "@/entities/legendary-event"

/** When the next token arrives: at `targetMs`, or already due (the timer ran out since the sync). */
type NextTokenViewModel =
  { kind: "pending"; targetMs: number } | { kind: "due" }

/** The Run status body: synced values, no entry for this event, or the player data unavailable. */
export type RunStatusViewModel =
  | { kind: "loading" }
  | { kind: "unavailable" }
  | { kind: "noEntry" }
  | {
      kind: "synced"
      run: number | null
      tokens: {
        current: number
        max: number
        /** Absent when the bucket is full or its timer is unknown. */
        next: NextTokenViewModel | null
      } | null
      points: number
      currency: number
      chestsClaimed: number
      shards: number
      /** `undefined` past the last milestone or without `lre-common`. */
      milestone: NextPointsMilestone | undefined
    }

export interface LegendaryEventPageViewModel {
  event: LegendaryEvent
  name: string
  lifecycle: LegendaryEventLifecycle
  nowMs: number
  runStatus: RunStatusViewModel
  /** When player data last synced (manifest `syncedAt`): `null` before the first sync, `undefined`
   *  while that read is pending or failed (the line is then hidden rather than misreported). */
  syncedAtMs: number | null | undefined
  /** The lanes lane-scoped sections render: all three on desktop, the selected one on mobile. */
  laneIds: readonly LegendaryEventLaneId[]
  selectedLane: LegendaryEventLaneId
  onSelectLane: (lane: LegendaryEventLaneId) => void
}

/**
 * Run status from the synced `lre-progress` entry and the shared reward ladder. Tokens and
 * regeneration are read from the sync, never computed locally: the next-token timer is anchored to
 * the instant the chunk was observed (`progressObservedAtMs`), so it counts down between syncs.
 */
export function buildRunStatusViewModel({
  progress,
  common,
  progressObservedAtMs,
  nowMs,
}: {
  progress: ReadState<LegendaryEventProgress | undefined>
  common: ReadState<LegendaryEventCommon | null>
  progressObservedAtMs: number | null
  nowMs: number
}): RunStatusViewModel {
  if (progress.status === "loading") return { kind: "loading" }
  if (progress.status === "error") return { kind: "unavailable" }
  if (!progress.data) return { kind: "noEntry" }
  const entry = progress.data
  const bucket = entry.currentEventTokens

  const next = ((): NextTokenViewModel | null => {
    if (!bucket || bucket.current >= bucket.max) return null
    if (progressObservedAtMs === null || !(bucket.nextTokenInSeconds >= 0)) {
      return null
    }
    const targetMs = progressObservedAtMs + bucket.nextTokenInSeconds * 1000
    return targetMs > nowMs ? { kind: "pending", targetMs } : { kind: "due" }
  })()

  return {
    kind: "synced",
    run: entry.currentEventRun,
    tokens: bucket ? { current: bucket.current, max: bucket.max, next } : null,
    points: entry.currentPoints,
    currency: entry.currentCurrency,
    // The Tacticus API sends a 1-based count of chests opened (2 = two opened), and -1 when it
    // omits the field (V1 token-estimation-service documents the same), so clamp at zero.
    chestsClaimed: Math.max(0, entry.currentClaimedChestIndex),
    shards: entry.currentShards,
    milestone: nextPointsMilestone(
      common.status === "ready" ? common.data : null,
      entry.currentPoints
    ),
  }
}

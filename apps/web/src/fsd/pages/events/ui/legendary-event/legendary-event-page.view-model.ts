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

/** The Run status body: synced values, no entry for this event, or the player data unavailable. */
export type RunStatusView =
  | { kind: "loading" }
  | { kind: "unavailable" }
  | { kind: "noEntry" }
  | {
      kind: "synced"
      run: number | null
      tokens: {
        current: number
        max: number
        /** Seconds to the next token, absent when the bucket is full. */
        nextTokenInSeconds: number | null
      } | null
      points: number
      currency: number
      chestsClaimed: number
      shards: number
      /** `undefined` past the last milestone or without `lre-common`. */
      milestone: NextPointsMilestone | undefined
    }

export interface LegendaryEventPageViewProps {
  event: LegendaryEvent
  name: string
  lifecycle: LegendaryEventLifecycle
  nowMs: number
  runStatus: RunStatusView
  /** When player data last synced (manifest `syncedAt`), `null` before the first sync. */
  syncedAtMs: number | null
  /** The lanes lane-scoped sections render: all three on desktop, the selected one on mobile. */
  laneIds: readonly LegendaryEventLaneId[]
  selectedLane: LegendaryEventLaneId
  onSelectLane: (lane: LegendaryEventLaneId) => void
}

/** Run status from the synced `lre-progress` entry and the shared reward ladder. Tokens and
 *  regeneration are read from the sync, never computed locally. */
export function buildRunStatusView(
  progress: ReadState<LegendaryEventProgress | undefined>,
  common: ReadState<LegendaryEventCommon | null>
): RunStatusView {
  if (progress.status === "loading") return { kind: "loading" }
  if (progress.status === "error") return { kind: "unavailable" }
  if (!progress.data) return { kind: "noEntry" }
  const entry = progress.data
  const bucket = entry.currentEventTokens
  return {
    kind: "synced",
    run: entry.currentEventRun,
    tokens: bucket
      ? {
          current: bucket.current,
          max: bucket.max,
          nextTokenInSeconds:
            bucket.current < bucket.max ? bucket.nextTokenInSeconds : null,
        }
      : null,
    points: entry.currentPoints,
    currency: entry.currentCurrency,
    // The claimed-chest index is zero-based, so index 4 means five chests claimed.
    chestsClaimed: entry.currentClaimedChestIndex + 1,
    shards: entry.currentShards,
    milestone: nextPointsMilestone(
      common.status === "ready" ? common.data : null,
      entry.currentPoints
    ),
  }
}

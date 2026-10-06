import {
  LEGENDARY_EVENT_LANE_IDS,
  buildLaneLeaderboard,
  buildLanePointsModel,
  buildSyncedLaneProgress,
  nextPointsMilestone,
  type LaneProgressView,
  type LeaderboardRow,
  type LeaderboardSort,
  type LegendaryEvent,
  type LegendaryEventCommon,
  type LegendaryEventLaneId,
  type LegendaryEventLifecycle,
  type LegendaryEventProgress,
  type LegendaryEventRosterUnit,
  type LegendaryEventUnit,
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
  leaderboard: LeaderboardViewModel
  progressGrid: ProgressGridViewModel
}

type ByLane<T> = Record<LegendaryEventLaneId, T>

/** The leaderboard rows per lane, in default order, before the user's sort and filter. */
export type LeaderboardRowsViewModel =
  | { kind: "loading" }
  | { kind: "unavailable" }
  | {
      kind: "ready"
      rowsByLane: ByLane<LeaderboardRow[]>
      /** `false` when the roster chunk is unavailable: ownership is then unknown (design D5). */
      rosterAvailable: boolean
    }

/** The Eligibility leaderboard: its rows plus the sort / "Only unlocked" state shared by the three
 *  lanes, owned by the page orchestrator (design D4). */
export type LeaderboardViewModel = LeaderboardRowsViewModel & {
  sort: LeaderboardSort
  onSortChange: (sort: LeaderboardSort) => void
  onlyUnlocked: boolean
  onOnlyUnlockedChange: (onlyUnlocked: boolean) => void
}

/** The Synced progress section: per-lane progress over the points model, or the read's state. */
export type ProgressGridViewModel =
  | { kind: "loading" }
  | { kind: "unavailable" }
  | { kind: "ready"; lanes: ByLane<LaneProgressView> }

/** A read's data, or its pending / failed status: a value that stays referentially stable across
 *  renders, so the builders below can be memoised on it. */
export type ReadValue<T> = T | "loading" | "error"

export function readValue<T>(state: ReadState<T>): ReadValue<T> {
  return state.status === "ready" ? state.data : state.status
}

/**
 * Per-lane leaderboard rows over the catalog characters and the synced roster. Waits for both
 * reads; a failed or never-synced roster yields unknown ownership rather than "all locked".
 */
export function buildLeaderboardRows(
  event: LegendaryEvent,
  units: ReadValue<LegendaryEventUnit[]>,
  roster: ReadValue<LegendaryEventRosterUnit[] | undefined>
): LeaderboardRowsViewModel {
  if (units === "loading" || roster === "loading") return { kind: "loading" }
  if (units === "error") return { kind: "unavailable" }
  const rosterData = roster === "error" ? undefined : roster
  const rowsByLane = Object.fromEntries(
    LEGENDARY_EVENT_LANE_IDS.map((laneId) => [
      laneId,
      buildLaneLeaderboard(event[laneId], units, rosterData),
    ])
  ) as ByLane<LeaderboardRow[]>
  return {
    kind: "ready",
    rowsByLane,
    rosterAvailable: rosterData !== undefined,
  }
}

/** Per-lane synced progress: the event's `lre-progress` entry mapped onto each lane's points model
 *  (an absent entry presents every lane as "no synced progress for this event yet"). */
export function buildProgressGridViewModel(
  event: LegendaryEvent,
  progress: ReadValue<LegendaryEventProgress | undefined>
): ProgressGridViewModel {
  if (progress === "loading") return { kind: "loading" }
  if (progress === "error") return { kind: "unavailable" }
  const entry = progress
  const lanes = Object.fromEntries(
    LEGENDARY_EVENT_LANE_IDS.map((laneId) => [
      laneId,
      buildSyncedLaneProgress(
        buildLanePointsModel(event[laneId]),
        entry ? entry[laneId] : undefined
      ),
    ])
  ) as ByLane<LaneProgressView>
  return { kind: "ready", lanes }
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

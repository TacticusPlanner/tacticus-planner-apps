import {
  LEGENDARY_EVENT_LANE_IDS,
  buildCrossLaneLeaderboard,
  buildLaneLeaderboard,
  buildLanePointsModel,
  buildSyncedLaneProgress,
  laneBattlePowers,
  nextPointsMilestone,
  teamClearEstimate,
  unitClearEstimate,
  type ClearEstimate,
  type ClearEstimateConfigState,
  type CrossLaneLeaderboardRow,
  type LaneProgressView,
  type LeaderboardRow,
  type LegendaryEvent,
  type LegendaryEventBattle,
  type LegendaryEventCommon,
  type LegendaryEventLaneId,
  type LegendaryEventLifecycle,
  type LegendaryEventProgress,
  type LegendaryEventRosterUnit,
  type LegendaryEventUnit,
  type NextPointsMilestone,
  type ReadState,
} from "@/entities/legendary-event"

import type { TeamsViewModel } from "./teams/teams-section"

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

/** The page's tab strip: Overview, then one tab per lane (design D3). */
export type LegendaryEventTab = "overview" | LegendaryEventLaneId

export interface LegendaryEventPageViewModel {
  event: LegendaryEvent
  name: string
  lifecycle: LegendaryEventLifecycle
  nowMs: number
  runStatus: RunStatusViewModel
  /** When player data last synced (manifest `syncedAt`): `null` before the first sync, `undefined`
   *  while that read is pending or failed (the line is then hidden rather than misreported). */
  syncedAtMs: number | null | undefined
  selectedTab: LegendaryEventTab
  onSelectTab: (tab: LegendaryEventTab) => void
  /** Selects the lane's tab and scrolls its Synced progress grid into view. */
  onJumpToLane: (lane: LegendaryEventLaneId) => void
  leaderboard: LeaderboardViewModel
  progressGrid: ProgressGridViewModel
  /** The lane tabs' Teams section: the plan, the current run and the plan actions. */
  teams: TeamsViewModel
}

type ByLane<T> = Record<LegendaryEventLaneId, T>

/** The leaderboard rows per lane and across lanes, in default order, before the user's filters. */
export type LeaderboardRowsViewModel =
  | { kind: "loading" }
  | { kind: "unavailable" }
  | {
      kind: "ready"
      rowsByLane: ByLane<LeaderboardRow[]>
      crossLaneRows: CrossLaneLeaderboardRow[]
      /** `false` when the roster chunk is unavailable: ownership is then unknown (design D5). */
      rosterAvailable: boolean
      /** `false` when the progress read failed: nothing then counts as scored. */
      progressAvailable: boolean
    }

/** The filter and toggle state shared by the lane and Overview leaderboards (design D7), owned by
 *  the page orchestrator. */
export interface LeaderboardControlsState {
  onlyUnlocked: boolean
  onOnlyUnlockedChange: (onlyUnlocked: boolean) => void
  deductScored: boolean
  onDeductScoredChange: (deductScored: boolean) => void
  /** `objectiveFilterKey`s every listed unit must satisfy. */
  selectedObjectives: ReadonlySet<string>
  onSelectedObjectivesChange: (keys: ReadonlySet<string>) => void
}

export type LeaderboardViewModel = LeaderboardRowsViewModel &
  LeaderboardControlsState & {
    /** The lane leaderboards' Clears figure (not shown on the Overview leaderboard). */
    clears: ClearEstimatesViewModel
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
 * Per-lane and cross-lane leaderboard rows over the catalog characters, the synced roster and the
 * synced progress. Waits for every read; a failed or never-synced roster yields unknown ownership
 * rather than "all locked", and a failed progress read deducts nothing.
 */
export function buildLeaderboardRows(
  event: LegendaryEvent,
  units: ReadValue<LegendaryEventUnit[]>,
  roster: ReadValue<LegendaryEventRosterUnit[] | undefined>,
  progressGrid: ProgressGridViewModel
): LeaderboardRowsViewModel {
  if (
    units === "loading" ||
    roster === "loading" ||
    progressGrid.kind === "loading"
  ) {
    return { kind: "loading" }
  }
  if (units === "error") return { kind: "unavailable" }
  const rosterData = roster === "error" ? undefined : roster
  const progressByLane =
    progressGrid.kind === "ready" ? progressGrid.lanes : undefined
  const rowsByLane = Object.fromEntries(
    LEGENDARY_EVENT_LANE_IDS.map((laneId) => [
      laneId,
      buildLaneLeaderboard(
        event[laneId],
        units,
        rosterData,
        progressByLane?.[laneId]
      ),
    ])
  ) as ByLane<LeaderboardRow[]>
  return {
    kind: "ready",
    rowsByLane,
    crossLaneRows: buildCrossLaneLeaderboard(
      event,
      units,
      rosterData,
      progressByLane ?? {}
    ),
    rosterAvailable: rosterData !== undefined,
    progressAvailable: progressByLane !== undefined,
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

/** One lane's estimators over the synced roster (design D3): null when there is nothing to
 *  estimate (no owned member, or the unit is not owned). */
interface LaneClearEstimator {
  team: (memberUnitIds: readonly string[]) => ClearEstimate | null
  unit: (unitId: string) => ClearEstimate | null
}

/**
 * Clear estimates by data state (design D6): `hidden` when the `lre-clear-estimate` dataset is
 * absent or failed (or the battles could not be read), `pending` while the dataset, the battles or
 * the roster load, `ready` otherwise. A roster that could not be read yields estimators that
 * return null (ownership unknown).
 */
export type ClearEstimatesViewModel =
  | { kind: "hidden" }
  | { kind: "pending" }
  | { kind: "ready"; byLane: ByLane<LaneClearEstimator> }

const NO_ESTIMATOR: LaneClearEstimator = { team: () => null, unit: () => null }

export function buildClearEstimates({
  event,
  config,
  battles,
  roster,
}: {
  event: LegendaryEvent
  config: ClearEstimateConfigState
  battles: ReadValue<LegendaryEventBattle[]>
  roster: ReadValue<LegendaryEventRosterUnit[] | undefined>
}): ClearEstimatesViewModel {
  if (config.status === "absent" || config.status === "failed") {
    return { kind: "hidden" }
  }
  if (battles === "error") return { kind: "hidden" }
  if (
    config.status === "loading" ||
    battles === "loading" ||
    roster === "loading"
  ) {
    return { kind: "pending" }
  }
  const rosterById =
    roster === "error" || roster === undefined
      ? undefined
      : new Map(roster.map((unit) => [unit.unitId as string, unit]))
  const byLane = Object.fromEntries(
    LEGENDARY_EVENT_LANE_IDS.map((laneId): [string, LaneClearEstimator] => {
      const powers = laneBattlePowers(event[laneId].battleIds, battles)
      if (!rosterById || !powers || powers.length === 0) {
        return [laneId, NO_ESTIMATOR]
      }
      return [
        laneId,
        {
          team: (memberUnitIds) =>
            teamClearEstimate(memberUnitIds, powers, rosterById, config.config),
          unit: (unitId) =>
            unitClearEstimate(unitId, powers, rosterById, config.config),
        },
      ]
    })
  ) as ByLane<LaneClearEstimator>
  return { kind: "ready", byLane }
}

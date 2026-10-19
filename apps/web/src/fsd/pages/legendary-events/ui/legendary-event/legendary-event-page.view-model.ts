import {
  LEGENDARY_EVENT_LANE_IDS,
  buildCrossLaneLeaderboard,
  buildLaneLeaderboard,
  buildLanePointsModel,
  buildSyncedLaneProgress,
  laneBattlePowers,
  nextPointsMilestone,
  projectRewards,
  teamClearEstimate,
  unitClearEstimate,
  type ClearEstimate,
  type ClearEstimateConfigState,
  type LaneEstimateInputs,
  type LegendaryEventGoalTarget,
  type CrossLaneLeaderboardRow,
  type LaneProgressView,
  type LeaderboardRow,
  type LegendaryEvent,
  type LegendaryEventBattle,
  type LegendaryEventLaneId,
  type LegendaryEventLifecycle,
  type LegendaryEventPlan,
  type LegendaryEventProgress,
  type LegendaryEventRewards,
  type LegendaryEventRosterUnit,
  type LegendaryEventRunResolution,
  type LegendaryEventUnit,
  type NextPointsMilestone,
  type ReadState,
  type RewardProjection,
  type RunHistory,
} from "@/entities/legendary-event"

import type { UpgradeImpactState } from "@/features/legendary-event-goals"
import type {
  MarkTokenHandler,
  OpenTeamsHandler,
  TokenPlanView,
} from "@/features/legendary-event-tokens"

import type { BattlesViewModel } from "./battles/battles.view-model"
import type { LanePotentialsViewModel } from "./lane-potential.view-model"
import type { LastRunViewModel } from "./overview/last-run.view-model"
import type { ProgressMarksViewModel } from "./progress/progress-marks"
import type { TeamEditorLauncher } from "./teams/team-editor-launcher"
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
      /** `undefined` past the last milestone or without the event's reward ladder. */
      milestone: NextPointsMilestone | undefined
    }

/** The Run status card's Reward outlook (design D6): a skeleton while the synced entry or the plan
 *  loads, hidden when the synced data or the event's ladder is unavailable, else the projection. */
export type RewardOutlookViewModel =
  | { kind: "loading" }
  | { kind: "unavailable" }
  | { kind: "ready"; projection: RewardProjection }

/** The Run status card's Inputs drawer: shown for signed-in users only. */
export interface RunInputsViewModel {
  enabled: boolean
  /** The resolved runs the drawer labels Done / Now / Planned against. */
  runs: LegendaryEventRunResolution
}

/** The page's tab strip: Overview, then one tab per lane (design D3). */
export type LegendaryEventTab = "overview" | LegendaryEventLaneId

export interface LegendaryEventPageViewModel {
  event: LegendaryEvent
  name: string
  lifecycle: LegendaryEventLifecycle
  nowMs: number
  runStatus: RunStatusViewModel
  outlook: RewardOutlookViewModel
  runInputs: RunInputsViewModel
  /** When player data last synced (manifest `syncedAt`): `null` before the first sync, `undefined`
   *  while that read is pending or failed (the line is then hidden rather than misreported). */
  syncedAtMs: number | null | undefined
  selectedTab: LegendaryEventTab
  onSelectTab: (tab: LegendaryEventTab) => void
  /** Selects the lane's tab and scrolls its Synced progress grid into view. */
  onJumpToLane: (lane: LegendaryEventLaneId) => void
  leaderboard: LeaderboardViewModel
  progressGrid: ProgressGridViewModel
  /** Maybe clear / Stop here marks on the progress grid's not-cleared cells. */
  marks: ProgressMarksViewModel
  /** The lane tabs' Teams section: the plan, the current run and the plan actions. */
  teams: TeamsViewModel
  /** The page's single team editor (design D4), opened by Teams and the leaderboards. */
  teamEditor: TeamEditorLauncher
  /** The selected lane's Upgrade impact (Stage 6); null on Overview or signed out. */
  upgradeImpact: UpgradeImpactViewModel | null
  /** The selected lane's Battles section (battle preview); null on Overview. */
  battles: BattlesViewModel | null
  /** The Overview's Next token card, Token plan and Run forecast (Stage 4). */
  tokens: TokensViewModel
  /** The Overview's Last run card (run history). */
  lastRun: LastRunSectionViewModel
  /** Every lane's roster potential map (lane overview) and reach line (Overview lane summary). */
  potentials: LanePotentialsViewModel
}

/** The Last run card's state and its analytics callbacks (design D9). */
export interface LastRunSectionViewModel {
  state: LastRunViewModel
  /** Records `legendary_event_last_run_viewed`, once per page view. */
  onViewed: (history: RunHistory) => void
  /** Records `legendary_event_earlier_runs_expanded`. */
  onEarlierExpanded: (recordCount: number) => void
}

interface UpgradeImpactViewModel {
  state: UpgradeImpactState
  /** Goal targets by unit, for "In goals" and badges; undefined while goals load or failed. */
  goalTargets: ReadonlyMap<string, LegendaryEventGoalTarget> | undefined
  teamName: (teamId: string) => string
}

interface TokensViewModel {
  view: TokenPlanView
  /** Absent while marks cannot be written (signed out, or the plan has not loaded). */
  onMarkToken: MarkTokenHandler | undefined
  /** Selects a lane's tab and scrolls its Teams section (or one team's card) into view. */
  onOpenTeams: OpenTeamsHandler
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

/** Goals Preview availability (design D8): goals loading, failed, none for the event's units. */
/** `noRoster`: goals are known but there is no synced roster to preview them over. */
export type GoalsPreviewAvailability =
  "loading" | "failed" | "noGoals" | "noRoster" | "ready"

/** The leaderboards' goal integration (Stage 6): the Goals Preview switch, badges, Create goal. */
export interface LeaderboardGoalsViewModel {
  /** The page's switch value; only effective while `availability` is ready. */
  previewEnabled: boolean
  availability: GoalsPreviewAvailability
  onPreviewChange: (enabled: boolean) => void
  /** Units shown at their goal targets (empty while the preview is off). */
  previewed: ReadonlySet<string>
  /** A unit's goal badge lines (none while goals load or failed). */
  badgeLines: (unitId: string) => readonly string[]
  /** Opens the goal-creation sheet for a row (ownership read from the synced roster). */
  onCreateGoal: (unitId: string, laneId: LegendaryEventLaneId | null) => void
}

export type LeaderboardViewModel = LeaderboardRowsViewModel &
  LeaderboardControlsState & {
    /** The lane leaderboards' Clears figure (not shown on the Overview leaderboard). */
    clears: ClearEstimatesViewModel
    goals: LeaderboardGoalsViewModel
    /** Opens the team editor on the lane with the row's unit as first member (Add to new team);
     *  absent while teams cannot be edited (signed out, or the plan is not ready). */
    onAddToTeam?: (unitId: string, laneId: LegendaryEventLaneId) => void
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
 * Run status from the synced `lre-progress` entry and the event's own reward ladder. Tokens and
 * regeneration are read from the sync, never computed locally: the next-token timer is anchored to
 * the instant the chunk was observed (`progressObservedAtMs`), so it counts down between syncs.
 */
export function buildRunStatusViewModel({
  progress,
  rewards,
  progressObservedAtMs,
  nowMs,
}: {
  progress: ReadState<LegendaryEventProgress | undefined>
  /** `undefined` for a catalog record cached before rewards were served. */
  rewards: LegendaryEventRewards | undefined
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
    milestone: nextPointsMilestone(rewards, entry.currentPoints),
  }
}

/**
 * The Reward outlook over the event's ladder, the synced entry, the event unit's roster record and
 * the plan's run inputs (design D2, D6; fix-legendary-event-run-and-goal D5). Signed out
 * (`planEnabled` false) or with a plan that failed to load, the projection runs without inputs;
 * without a synced entry it starts from zero. A roster that failed or never synced counts the unit
 * as not owned (Unlock).
 */
export function buildRewardOutlookViewModel({
  rewards,
  progress,
  unit,
  resolution,
  plan,
  planEnabled,
}: {
  rewards: LegendaryEventRewards | undefined
  progress: ReadValue<LegendaryEventProgress | undefined>
  /** The event unit's roster record (`eventUnitRecord`), or the roster read's status. */
  unit: ReadValue<LegendaryEventRosterUnit | undefined>
  resolution: LegendaryEventRunResolution
  plan: { isPending: boolean; data: LegendaryEventPlan | undefined }
  planEnabled: boolean
}): RewardOutlookViewModel {
  if (
    progress === "loading" ||
    unit === "loading" ||
    (planEnabled && plan.isPending)
  ) {
    return { kind: "loading" }
  }
  if (progress === "error" || !rewards) return { kind: "unavailable" }
  return {
    kind: "ready",
    projection: projectRewards({
      rewards,
      progress,
      resolution,
      unit: unit === "error" ? undefined : unit,
      runs: plan.data?.runs,
      showPaidOptions: plan.data?.showPaidOptions ?? false,
    }),
  }
}

/** The event unit's synced roster record; undefined when it is not owned or the roster is unknown. */
export function eventUnitRecord(
  roster: ReadValue<readonly LegendaryEventRosterUnit[] | undefined>,
  eventId: string
): LegendaryEventRosterUnit | undefined {
  return Array.isArray(roster)
    ? roster.find((unit) => unit.unitId === eventId)
    : undefined
}

/** One lane's estimators over the synced roster (design D3): null when there is nothing to
 *  estimate (no owned member, or the unit is not owned). `inputs` (Stage 6's upgrade impact and
 *  suggestions) is absent when the roster is unknown or the lane's battles have no powers. */
interface LaneClearEstimator {
  team: (memberUnitIds: readonly string[]) => ClearEstimate | null
  unit: (unitId: string) => ClearEstimate | null
  inputs?: LaneEstimateInputs
}

/**
 * Clear estimates by data state (design D6): `hidden` when the horde-mode tier list, the power data
 * or the battles could not be read, `pending` while the tier list, the power data, the battles or
 * the roster load, `ready` otherwise. A roster that could not be read, or an absent `unit-power`
 * dataset, yields estimators that return null and no inputs (depths are manual-only).
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
  if (config.status === "failed") {
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
      if (
        !rosterById ||
        !config.config.unitPower ||
        !powers ||
        powers.length === 0
      ) {
        return [laneId, NO_ESTIMATOR]
      }
      return [
        laneId,
        {
          team: (memberUnitIds) =>
            teamClearEstimate(memberUnitIds, powers, rosterById, config.config),
          unit: (unitId) =>
            unitClearEstimate(unitId, powers, rosterById, config.config),
          inputs: {
            battlePowers: powers,
            roster: rosterById,
            config: config.config,
          },
        },
      ]
    })
  ) as ByLane<LaneClearEstimator>
  return { kind: "ready", byLane }
}

/** A lane's estimate inputs for upgrade impact and suggestions: "pending" while estimates load,
 *  undefined when they are unavailable. */
export function laneEstimateInputs(
  clears: ClearEstimatesViewModel,
  laneId: LegendaryEventLaneId
): LaneEstimateInputs | "pending" | undefined {
  if (clears.kind === "pending") return "pending"
  if (clears.kind === "hidden") return undefined
  return clears.byLane[laneId].inputs
}

import {
  deriveLegendaryEventLifecycle,
  resolveLegendaryEventRunsAt,
  type LegendaryEventPlan,
  type LegendaryEventProgress,
  type LegendaryEventRunResolution,
  type LegendaryEventTeam,
} from "@/entities/legendary-event"
import { utharEvent } from "@/test/fixtures/legendary-events"

import { workedAlphaRecord } from "./token-plan.fixtures"
import type { TokenPlanViewInput } from "./token-plan-view"

// The worked Uthar example as the page reads it: synced run 2 with 76 hours left, Five (estimated
// depth 6) and Melee (stored depth 5 for run 2) on Alpha, Stage 3's run 3 inputs.

const HOUR = 60 * 60 * 1000
const WORKED_NOW = Date.parse("2026-10-15T12:00:00Z")

const FIVE_MEMBERS = [
  "ultraCalgar",
  "ultraTigurius",
  "ultraTitus",
  "ultraApothecary",
  "ultraEliminatorSgt",
]

const team = (
  overrides: Partial<LegendaryEventTeam> & Pick<LegendaryEventTeam, "id">
): LegendaryEventTeam => ({
  laneId: "alpha",
  name: overrides.id,
  sortOrder: 0,
  memberUnitIds: [],
  reserveUnitId: null,
  objectiveIndexes: [],
  runDepths: [],
  ...overrides,
})

export const workedTeams: LegendaryEventTeam[] = [
  team({
    id: "five",
    name: "Five",
    memberUnitIds: FIVE_MEMBERS,
    objectiveIndexes: [0],
  }),
  team({
    id: "melee",
    name: "Melee",
    sortOrder: 1,
    memberUnitIds: ["ultraCalgar", "ultraTitus", "ultraApothecary"],
    objectiveIndexes: [0, 3],
    runDepths: [
      {
        run: 2,
        expectedBattleClears: 5,
        expectedBattleClearsSource: "manual",
        recordedAt: "2026-10-15T00:00:00Z",
      },
    ],
  }),
]

const workedProgress = {
  id: "votanUthar",
  alpha: workedAlphaRecord,
  beta: null,
  gamma: null,
  currentEventRun: 2,
  currentEventTokens: {
    current: 3,
    max: 12,
    nextTokenInSeconds: 5400,
    regenDelayInSeconds: 10_800,
  },
  hasUsedAdForExtraTokenToday: false,
  extraCurrencyPerPayout: null,
  currentPoints: 5000,
  currentCurrency: 120,
  currentClaimedChestIndex: 10,
  currentShards: 250,
} as unknown as LegendaryEventProgress

/** Uthar Alpha's imported two-member team (spec: a stored team below three characters is
 *  incomplete): Max 2 Hits and Melee, stored depth 5 for run 2. */
export const utharShortTeam: LegendaryEventTeam = team({
  id: "short",
  name: "Max 2 Hits · Melee",
  memberUnitIds: ["ultraApothecary", "bloodIntercessor"],
  objectiveIndexes: [2, 3],
  runDepths: [
    {
      run: 2,
      expectedBattleClears: 5,
      expectedBattleClearsSource: "manual",
      recordedAt: "2026-10-15T00:00:00Z",
    },
  ],
})

export const workedPlan = (
  teams: LegendaryEventTeam[] = workedTeams,
  overrides: Partial<LegendaryEventPlan> = {}
): LegendaryEventPlan => ({
  eventId: "votanUthar",
  revision: 1,
  catalogVersion: "1",
  notes: null,
  showPaidOptions: true,
  teams,
  runs: [
    {
      run: 3,
      regularMissions: 10,
      premiumMissions: 0,
      bundlePurchased: true,
      closeShards: 0,
      updatedAt: "2026-10-15T00:00:00Z",
    },
  ],
  annotations: [],
  ...overrides,
})

/** Five's estimate is depth 6; every other team has none. */
const estimateTeam = (memberUnitIds: readonly string[]) =>
  memberUnitIds.length === FIVE_MEMBERS.length ? { depth: 6 } : null

const workedEstimates: TokenPlanViewInput["estimates"] = {
  kind: "ready",
  byLane: {
    alpha: { team: estimateTeam },
    beta: { team: () => null },
    gamma: { team: () => null },
  },
}

/** The run in progress, as resolved while an event is active (the synced run wins). */
export const inRun = (run: 1 | 2 | 3): LegendaryEventRunResolution => ({
  kind: "known",
  endedRuns: (run - 1) as 0 | 1 | 2,
  currentRun: run,
  nextRun: run < 3 ? ((run + 1) as 2 | 3) : null,
  nextStartMs: null,
})

/** 2026-10-16, between runs: the synced run is null and the schedule decides. */
const BETWEEN_RUNS_NOW = Date.parse("2026-10-16T00:00:00Z")

/** The page's inputs for an upcoming event at `BETWEEN_RUNS_NOW`: lifecycle and resolved runs from
 *  its schedule (index = run − 1), with the worked synced entry minus its run number. */
export function betweenRunsInput(
  eventStageStartDatesUtc: string[],
  overrides: Partial<TokenPlanViewInput> = {}
): TokenPlanViewInput {
  const schedule = { finished: false, eventStageStartDatesUtc }
  const lifecycle = deriveLegendaryEventLifecycle(schedule, BETWEEN_RUNS_NOW)
  const progress = {
    ...workedProgress,
    currentEventRun: null,
  } as LegendaryEventProgress
  return workedViewInput({
    event: { ...utharEvent, ...schedule },
    lifecycle,
    nowMs: BETWEEN_RUNS_NOW,
    progress,
    progressObservedAtMs: BETWEEN_RUNS_NOW,
    resolution: resolveLegendaryEventRunsAt(
      schedule,
      progress,
      BETWEEN_RUNS_NOW,
      lifecycle
    ),
    ...overrides,
  })
}

export const UTHAR_RUN_STARTS = ["2026-03-08T00:00:00Z", "2026-10-04T00:00:00Z"]

export function workedViewInput(
  overrides: Partial<TokenPlanViewInput> = {}
): TokenPlanViewInput {
  return {
    event: utharEvent,
    lifecycle: {
      state: "active",
      runStartMs: WORKED_NOW + 76 * HOUR - 7 * 24 * HOUR,
      runEndMs: WORKED_NOW + 76 * HOUR,
    },
    nowMs: WORKED_NOW,
    progress: workedProgress,
    progressObservedAtMs: WORKED_NOW,
    plan: { enabled: true, status: "success", data: workedPlan() },
    resolution: inRun(2),
    // The event unit is not in the synced roster: the forecast's steps start at Unlock.
    eventUnit: undefined,
    estimates: workedEstimates,
    ...overrides,
  }
}

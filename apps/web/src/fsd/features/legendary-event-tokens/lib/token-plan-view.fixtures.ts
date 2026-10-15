import type {
  LegendaryEventPlan,
  LegendaryEventProgress,
  LegendaryEventTeam,
} from "@/entities/legendary-event"
import { utharEvent } from "@/test/fixtures/legendary-events"

import { workedAlphaRecord } from "./token-plan.fixtures"
import type { TokenPlanViewInput } from "./token-plan-view"

// The worked Uthar example as the page reads it: synced run 2 with 76 hours left, Five (estimated
// depth 6) and Melee (stored depth 5 for run 2) on Alpha, Stage 3's run 3 inputs.

const HOUR = 60 * 60 * 1000
export const WORKED_NOW = Date.parse("2026-10-15T12:00:00Z")

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
    run: 2,
    estimates: workedEstimates,
    ...overrides,
  }
}

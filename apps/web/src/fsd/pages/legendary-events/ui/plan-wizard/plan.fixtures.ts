import type { Progression } from "@workspace/game-domain"

import {
  buildLanePointsModel,
  buildSyncedLaneProgress,
  type ClearEstimateConfig,
  type LegendaryEventPlan,
  type LegendaryEventProgress,
  type LegendaryEventRosterUnit,
} from "@/entities/legendary-event"
import { legendaryEventCharacters } from "@/test/fixtures/legendary-event-characters"
import { utharEvent } from "@/test/fixtures/legendary-events"
import { unitPowerContextFixture } from "@/test/fixtures/unit-power"

import type { PlanInputs, PlanLane } from "./plan-inputs"

const DAY_MS = 24 * 60 * 60 * 1000

/** Uthar Alpha battles 1–7 (catalog `lre-battles` power). */
const ALPHA_POWERS = [1018, 3055, 8199, 20703, 40586, 75787, 134603]

export const NOW_MS = Date.parse("2026-10-06T00:00:00Z")
export const RUN_3_START_MS = Date.parse("2027-02-21T00:00:00Z")

const PLAN_CONFIG: ClearEstimateConfig = {
  powerRatio: 1.2,
  calibrated: true,
  hordeMultipliers: new Map(),
  unitPower: unitPowerContextFixture(),
}

function planRosterUnit(
  unitId: string,
  progressionIndex: Progression = "Epic:RedOneStar",
  rank: LegendaryEventRosterUnit["rank"] = "Gold1"
): LegendaryEventRosterUnit {
  return {
    unitId: unitId as LegendaryEventRosterUnit["unitId"],
    rank,
    progressionIndex,
    appliedUpgradeSlots: [],
    abilities: [
      { abilityId: "active", level: 20 },
      { abilityId: "passive", level: 15 },
    ] as LegendaryEventRosterUnit["abilities"],
  }
}

const PLAN_ROSTER = [
  "ultraCalgar",
  "ultraTigurius",
  "ultraTitus",
  "ultraApothecary",
  "ultraEliminatorSgt",
  "bloodDante",
  "bloodMephiston",
  "darkaAzrael",
].map((unitId) => planRosterUnit(unitId))

export const EMPTY_PLAN: LegendaryEventPlan = {
  eventId: utharEvent.id,
  revision: 1,
  catalogVersion: "test",
  notes: null,
  showPaidOptions: false,
  teams: [],
  runs: [],
  annotations: [],
}

const progress = {
  currentPoints: 0,
  currentCurrency: 0,
  currentClaimedChestIndex: 0,
  currentShards: 0,
  extraCurrencyPerPayout: null,
  currentEventRun: 2,
  alpha: null,
  beta: null,
  gamma: null,
} as unknown as LegendaryEventProgress

function planLane(laneId: PlanLane["laneId"]): PlanLane {
  const lane = utharEvent[laneId]
  const model = buildLanePointsModel(lane)
  return {
    laneId,
    lane,
    model,
    progress: buildSyncedLaneProgress(model, null),
    battlePowers: laneId === "alpha" ? ALPHA_POWERS : [],
  }
}

/** Uthar in run 2 with no points yet, run 3 starting 21 February 2027 (estimated). */
export function planInputs(overrides: Partial<PlanInputs> = {}): PlanInputs {
  return {
    event: utharEvent,
    lanes: [planLane("alpha"), planLane("beta"), planLane("gamma")],
    units: legendaryEventCharacters,
    roster: PLAN_ROSTER,
    config: PLAN_CONFIG,
    lifecycle: {
      state: "active",
      runStartMs: NOW_MS - DAY_MS,
      runEndMs: NOW_MS + 6 * DAY_MS,
    },
    resolution: {
      kind: "known",
      endedRuns: 1,
      currentRun: 2,
      nextRun: 3,
      nextStartMs: null,
    },
    nowMs: NOW_MS,
    progress,
    progressObservedAtMs: NOW_MS,
    eventUnit: undefined,
    plan: EMPTY_PLAN,
    runStarts: [
      { run: 1, startMs: Date.parse("2026-03-08T00:00:00Z"), estimated: false },
      { run: 2, startMs: NOW_MS - DAY_MS, estimated: false },
      { run: 3, startMs: RUN_3_START_MS, estimated: true },
    ],
    initialRarityOf: () => "Epic",
    nameOf: (unitId) => unitId,
    ...overrides,
  }
}

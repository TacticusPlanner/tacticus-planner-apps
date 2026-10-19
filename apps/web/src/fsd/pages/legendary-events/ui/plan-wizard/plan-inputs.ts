import type { Rarity } from "@workspace/game-domain"

import {
  LEGENDARY_EVENT_LANE_IDS,
  currentLegendaryEventRun,
  type ClearEstimateConfig,
  type LaneProgressView,
  type LanePointsModel,
  type LegendaryEvent,
  type LegendaryEventLane,
  type LegendaryEventLaneId,
  type LegendaryEventLifecycle,
  type LegendaryEventPlan,
  type LegendaryEventProgress,
  type LegendaryEventRosterUnit,
  type LegendaryEventRun,
  type LegendaryEventRunInputs,
  type LegendaryEventRunResolution,
  type LegendaryEventRunStart,
  type LegendaryEventUnit,
  type UpgradeStep,
} from "@/entities/legendary-event"

// The 1-click plan's generation model (change add-legendary-event-one-click-plan): everything the
// target verdicts, team generation and upgrade recommendations read, gathered once by the wizard.

/** One lane as the generation reads it. */
export interface PlanLane {
  laneId: LegendaryEventLaneId
  lane: LegendaryEventLane
  model: LanePointsModel
  progress: LaneProgressView | undefined
  /** The lane's battle powers; empty when the lane cannot be estimated. */
  battlePowers: readonly number[]
}

export interface PlanInputs {
  event: LegendaryEvent
  lanes: readonly PlanLane[]
  units: readonly LegendaryEventUnit[]
  /** The synced roster. */
  roster: readonly LegendaryEventRosterUnit[]
  config: ClearEstimateConfig
  lifecycle: LegendaryEventLifecycle
  resolution: LegendaryEventRunResolution
  nowMs: number
  progress: LegendaryEventProgress | undefined
  progressObservedAtMs: number | null
  /** The event unit's synced record (undefined when not owned). */
  eventUnit: LegendaryEventRosterUnit | undefined
  /** The stored plan the draft starts from. */
  plan: LegendaryEventPlan
  /** Runs 1–3 with their announced or estimated starts. */
  runStarts: readonly LegendaryEventRunStart[]
  initialRarityOf: (unitId: string) => Rarity | undefined
  nameOf: (unitId: string) => string
}

/** The run inputs and paid-options switch the wizard edits on its draft. */
export interface PlanEconomy {
  runs: readonly LegendaryEventRunInputs[]
  showPaidOptions: boolean
}

/** One chosen upgrade: a unit's step, ready from `readyMs`. */
export interface ChosenUpgrade {
  unitId: string
  step: UpgradeStep
  readyMs: number
}

/** The runs the plan still plays: the run in progress and later ones, or the runs not ended yet;
 *  only the next run while the run is unknown. */
export function planRuns(
  resolution: LegendaryEventRunResolution
): LegendaryEventRun[] {
  if (resolution.kind === "unknown") {
    return [currentLegendaryEventRun(resolution)]
  }
  return ([1, 2, 3] as const).filter((run) => run > resolution.endedRuns)
}

const ID_SEPARATOR = "|"

/** A stable key of the units whose state differs from the synced roster (cache keys). */
export function rosterKey(
  roster: ReadonlyMap<string, LegendaryEventRosterUnit>,
  base: ReadonlyMap<string, LegendaryEventRosterUnit>,
  unitIds?: ReadonlySet<string>
): string {
  const changed: string[] = []
  for (const [unitId, unit] of roster) {
    if (unitIds && !unitIds.has(unitId)) continue
    if (base.get(unitId) === unit) continue
    changed.push(
      `${unitId}:${unit.progressionIndex}:${unit.rank}:${unit.appliedUpgradeSlots?.length ?? 0}`
    )
  }
  return changed.sort().join(ID_SEPARATOR)
}

/**
 * The roster each plan run is expected to have (spec: teams are generated per lane for each run's
 * roster): the synced roster plus every chosen upgrade ready before the run's start. A run without
 * a start gets nothing new.
 */
export function projectedRosters(
  inputs: Pick<PlanInputs, "roster" | "runStarts" | "resolution">,
  chosen: readonly ChosenUpgrade[]
): Map<LegendaryEventRun, ReadonlyMap<string, LegendaryEventRosterUnit>> {
  const base = new Map(
    inputs.roster.map((unit) => [unit.unitId as string, unit])
  )
  const result = new Map<
    LegendaryEventRun,
    ReadonlyMap<string, LegendaryEventRosterUnit>
  >()
  for (const run of planRuns(inputs.resolution)) {
    const startMs =
      inputs.runStarts.find((start) => start.run === run)?.startMs ?? null
    const roster = new Map(base)
    if (startMs !== null) {
      for (const upgrade of chosen) {
        if (upgrade.readyMs <= startMs) {
          roster.set(upgrade.unitId, upgrade.step.unit)
        }
      }
    }
    result.set(run, roster)
  }
  return result
}

/** The lane ids allowing a unit. */
export function lanesAllowing(
  inputs: Pick<PlanInputs, "lanes">,
  unitId: string
): LegendaryEventLaneId[] {
  return inputs.lanes
    .filter((lane) =>
      (lane.lane.availableUnitIds as readonly string[]).includes(unitId)
    )
    .map((lane) => lane.laneId)
}

export const PLAN_LANE_IDS = LEGENDARY_EVENT_LANE_IDS

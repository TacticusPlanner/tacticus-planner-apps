import {
  nextUpgradeSteps,
  objectivesSatisfied,
  unitEffectivePower,
  unitLanePotential,
  type LegendaryEventRosterUnit,
  type LegendaryEventRun,
  type UpgradeStep,
} from "@/entities/legendary-event"

import type { PlanEvaluation, PlanEvaluator } from "./plan-evaluator"
import { planRuns, type ChosenUpgrade, type PlanInputs } from "./plan-inputs"

const DAY_MS = 24 * 60 * 60 * 1000

/** Upgrade goals one plan recommends at most (design D4). */
const MAX_PLAN_UPGRADES = 12
/** Steps one recommendation chains at most (one step alone rarely moves a team a battle). */
const MAX_CHAIN_STEPS = 3
/** Steps all of a unit's recommendations hold at most. */
const MAX_STEPS_PER_UNIT = 6
/** Owned and locked units per lane objective the candidates take beyond the team members. */
const OWNED_PER_OBJECTIVE = 4
const LOCKED_PER_OBJECTIVE = 2

export interface UpgradeRecommendation {
  unitId: string
  /** One to three consecutive steps; the last one's unit is the state reached. */
  steps: UpgradeStep[]
  /** Farming days these steps add after the unit's earlier recommended steps. */
  farmingDays: number
  readyMs: number
  /** The first plan run that starts after it is ready. */
  firstRun: LegendaryEventRun
  /** Ceiling points it added when chosen. */
  gain: number
  /** The ceiling with it and every earlier recommendation. */
  ceilingAfter: number
  /** An Active goal already covers it: nothing is created for it. */
  alreadyPlanned: boolean
}

export interface RecommendUpgradesInput {
  inputs: PlanInputs
  evaluator: PlanEvaluator
  /** Stop once the ceiling reaches it (Infinity explores until nothing gains). */
  targetPoints: number
  /** Farming days of a unit's chain of steps from its synced state, or null when it cannot be
   *  estimated (the step is then never recommended). */
  farmingDays: (unitId: string, steps: readonly UpgradeStep[]) => number | null
  alreadyPlanned: (unitId: string, step: UpgradeStep) => boolean
  /** The unit's master table total across served events (tie-break). */
  masterTotal: (unitId: string) => number
  /** The unit's horde-mode multiplier (tie-break). */
  hordeMultiplier: (unitId: string) => number
  cap?: number
}

export interface RecommendUpgradesResult {
  baseline: PlanEvaluation
  recommendations: UpgradeRecommendation[]
  final: PlanEvaluation
}

/** The units worth an upgrade: every generated team member, and per lane objective the strongest
 *  owned units and the locked ones scoring the most per battle. */
function candidateUnits(
  inputs: PlanInputs,
  evaluation: PlanEvaluation,
  roster: ReadonlyMap<string, LegendaryEventRosterUnit>
): string[] {
  const units = new Set(evaluation.teams.flatMap((team) => team.memberUnitIds))
  const byId = new Map(inputs.units.map((unit) => [unit.id as string, unit]))
  for (const planLane of inputs.lanes) {
    if (planLane.battlePowers.length === 0) continue
    const allowed = planLane.lane.availableUnitIds.flatMap((id) => {
      const unit = byId.get(id)
      return unit
        ? [
            {
              unit,
              satisfied: new Set(objectivesSatisfied(unit, planLane.lane)),
            },
          ]
        : []
    })
    for (const objective of planLane.lane.unitsRestrictions) {
      const matching = allowed.filter((entry) =>
        entry.satisfied.has(objective.index)
      )
      matching
        .filter((entry) => roster.has(entry.unit.id))
        .map((entry) => ({
          id: entry.unit.id,
          power: unitEffectivePower(entry.unit.id, roster, inputs.config) ?? 0,
        }))
        .sort((a, b) => b.power - a.power)
        .slice(0, OWNED_PER_OBJECTIVE)
        .forEach((entry) => units.add(entry.id))
      matching
        .filter((entry) => !roster.has(entry.unit.id))
        .map((entry) => ({
          id: entry.unit.id,
          perBattle: unitLanePotential(entry.unit, planLane.lane)
            .pointsPerBattle,
        }))
        .sort((a, b) => b.perBattle - a.perBattle)
        .slice(0, LOCKED_PER_OBJECTIVE)
        .forEach((entry) => units.add(entry.id))
    }
  }
  return [...units]
}

interface Scored {
  unitId: string
  steps: UpgradeStep[]
  farmingDays: number
  readyMs: number
  firstRun: LegendaryEventRun
  evaluation: PlanEvaluation
  gain: number
  score: number
}

/**
 * Upgrade recommendations (spec: upgrade recommendations close the shortfall; design D4), one
 * round per `next()`: each round scores every chain of one to three next steps of each candidate
 * unit, on top of the steps
 * already chosen, by the ceiling it adds divided by its farming days, drops steps ready after the
 * last plan run starts, and takes the best (ties: master table total, horde multiplier, name).
 * Recommendations queue: each is ready after the farming days of every earlier one. Stops at the
 * target, when nothing gains, or at the cap. A generator so the wizard can yield between rounds.
 */
export function* recommendUpgrades(
  input: RecommendUpgradesInput
): Generator<UpgradeRecommendation[], RecommendUpgradesResult> {
  const { inputs, evaluator } = input
  const cap = input.cap ?? MAX_PLAN_UPGRADES
  const runs = planRuns(inputs.resolution)
  const runStarts = runs.flatMap((run) => {
    const startMs =
      inputs.runStarts.find((start) => start.run === run)?.startMs ?? null
    return startMs === null ? [] : [{ run, startMs }]
  })
  const baseline = evaluator.evaluate([])
  const recommendations: UpgradeRecommendation[] = []
  const chosen: ChosenUpgrade[] = []
  const stepsByUnit = new Map<string, UpgradeStep[]>()
  let current = baseline
  let queueDays = 0

  while (
    recommendations.length < cap &&
    current.ceiling !== null &&
    current.ceiling < input.targetPoints
  ) {
    const lastRoster = current.rosters.get(runs.at(-1)!) ?? new Map()
    const unitState = (unitId: string) =>
      stepsByUnit.get(unitId)?.at(-1)?.unit ??
      inputs.roster.find((unit) => unit.unitId === unitId)
    let best: Scored | null = null
    for (const unitId of candidateUnits(inputs, current, lastRoster)) {
      const earlier = stepsByUnit.get(unitId) ?? []
      if (earlier.length >= MAX_STEPS_PER_UNIT) continue
      const before =
        earlier.length === 0 ? 0 : input.farmingDays(unitId, earlier)
      if (before === null) continue
      for (const steps of stepChains(
        unitState(unitId),
        unitId,
        inputs,
        MAX_STEPS_PER_UNIT - earlier.length
      )) {
        const total = input.farmingDays(unitId, [...earlier, ...steps])
        if (total === null) continue
        const farmingDays = Math.max(0, total - before)
        const readyMs = inputs.nowMs + (queueDays + farmingDays) * DAY_MS
        const firstRun = runStarts.find((entry) => entry.startMs >= readyMs)
        if (!firstRun) continue
        const evaluation = evaluator.evaluate([
          ...chosen,
          { unitId, step: steps.at(-1)!, readyMs },
        ])
        const gain = (evaluation.ceiling ?? 0) - (current.ceiling ?? 0)
        if (gain <= 0) continue
        const candidate: Scored = {
          unitId,
          steps,
          farmingDays,
          readyMs,
          firstRun: firstRun.run,
          evaluation,
          gain,
          score: gain / Math.max(1, farmingDays),
        }
        if (!best || better(candidate, best, input)) best = candidate
      }
    }
    if (!best) break
    chosen.push({
      unitId: best.unitId,
      step: best.steps.at(-1)!,
      readyMs: best.readyMs,
    })
    stepsByUnit.set(best.unitId, [
      ...(stepsByUnit.get(best.unitId) ?? []),
      ...best.steps,
    ])
    queueDays += best.farmingDays
    current = best.evaluation
    recommendations.push({
      unitId: best.unitId,
      steps: best.steps,
      farmingDays: best.farmingDays,
      readyMs: best.readyMs,
      firstRun: best.firstRun,
      gain: best.gain,
      ceilingAfter: best.evaluation.ceiling ?? 0,
      alreadyPlanned: best.steps.every((step) =>
        input.alreadyPlanned(best.unitId, step)
      ),
    })
    yield [...recommendations]
  }
  return { baseline, recommendations, final: current }
}

/** Every chain of one to `MAX_CHAIN_STEPS` next steps from a unit's state, one per state reached
 *  (rank and ascension commute: the cheaper order is the farming estimate's concern). */
function stepChains(
  unit: LegendaryEventRosterUnit | undefined,
  unitId: string,
  inputs: Pick<PlanInputs, "initialRarityOf">,
  stepsLeft: number
): UpgradeStep[][] {
  const chains = new Map<string, UpgradeStep[]>()
  const walk = (
    state: LegendaryEventRosterUnit | undefined,
    path: UpgradeStep[]
  ) => {
    if (path.length >= Math.min(MAX_CHAIN_STEPS, stepsLeft)) return
    for (const step of nextUpgradeSteps(
      state,
      unitId,
      inputs.initialRarityOf(unitId)
    )) {
      const next = [...path, step]
      const key = `${step.unit.progressionIndex}:${step.unit.rank}`
      if (!chains.has(key) || chains.get(key)!.length > next.length) {
        chains.set(key, next)
      }
      walk(step.unit, next)
    }
  }
  walk(unit, [])
  return [...chains.values()]
}

const SCORE_EPSILON = 1e-9

function better(
  a: Scored,
  b: Scored,
  input: Pick<
    RecommendUpgradesInput,
    "masterTotal" | "hordeMultiplier" | "inputs"
  >
): boolean {
  if (Math.abs(a.score - b.score) > SCORE_EPSILON) return a.score > b.score
  const total = input.masterTotal(a.unitId) - input.masterTotal(b.unitId)
  if (total !== 0) return total > 0
  const horde =
    input.hordeMultiplier(a.unitId) - input.hordeMultiplier(b.unitId)
  if (horde !== 0) return horde > 0
  return (
    input.inputs.nameOf(a.unitId).localeCompare(input.inputs.nameOf(b.unitId)) <
    0
  )
}

/** Runs the generator to the end at once (tests and small events). */
export function recommendUpgradesNow(
  input: RecommendUpgradesInput
): RecommendUpgradesResult {
  const iterator = recommendUpgrades(input)
  for (;;) {
    const next = iterator.next()
    if (next.done) return next.value
  }
}

/** The chosen upgrades a subset of recommendations amounts to, ready dates re-queued in order. */
export function chosenFrom(
  recommendations: readonly UpgradeRecommendation[],
  nowMs: number
): ChosenUpgrade[] {
  let queueDays = 0
  return recommendations.map((recommendation) => {
    queueDays += recommendation.farmingDays
    return {
      unitId: recommendation.unitId,
      step: recommendation.steps.at(-1)!,
      readyMs: nowMs + queueDays * DAY_MS,
    }
  })
}

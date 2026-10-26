import type { Progression, Rank } from "@workspace/game-domain"

import type {
  AscensionStep,
  LegendaryEventRosterUnit,
  UpgradeStep,
} from "@/entities/legendary-event"

import {
  bestStepWithinReach,
  stepVerdict,
  type StepTarget,
  type StepVerdict,
} from "./plan-ceiling"
import type { UpgradeChainRequest } from "./farming-days"
import type { UpgradeRecommendation } from "./plan-upgrades"

export const PLAN_WIZARD_STEPS = [
  "target",
  "upgrades",
  "teams",
  "runs",
  "review",
] as const

export type PlanWizardStep = (typeof PLAN_WIZARD_STEPS)[number]

export interface TargetOption {
  target: StepTarget
  verdict: StepVerdict
}

/** Each offered step with its verdict, and the highest step within reach. */
export function targetOptions(
  targets: readonly StepTarget[],
  syncedCeiling: number,
  upgradedCeiling: number
): { options: TargetOption[]; best: AscensionStep | null } {
  const options = targets.map((target) => ({
    target,
    verdict: stepVerdict(target, syncedCeiling, upgradedCeiling),
  }))
  return {
    options,
    best: bestStepWithinReach(
      options.map((option) => ({
        step: option.target.step,
        verdict: option.verdict,
      }))
    ),
  }
}

/** The recommendations a target needs: the prefix up to the first one whose ceiling reaches it, or
 *  all of them when none does (spec: until the target is at or below the ceiling). */
export function recommendationsFor(
  recommendations: readonly UpgradeRecommendation[],
  target: StepTarget | undefined,
  syncedCeiling: number
): number {
  if (!target || target.kind === "unreachable") return recommendations.length
  if (target.points <= syncedCeiling) return 0
  const index = recommendations.findIndex(
    (recommendation) => recommendation.ceilingAfter >= target.points
  )
  return index === -1 ? recommendations.length : index + 1
}

/**
 * Toggles one recommendation. A unit's later recommendation builds on its earlier ones, so ticking
 * one ticks the unit's earlier ones and unticking one unticks its later ones.
 */
export function toggleRecommendation(
  recommendations: readonly UpgradeRecommendation[],
  ticked: ReadonlySet<number>,
  index: number
): Set<number> {
  const next = new Set(ticked)
  const unitId = recommendations[index]?.unitId
  const on = !ticked.has(index)
  recommendations.forEach((recommendation, other) => {
    if (recommendation.unitId !== unitId) return
    if (on && other <= index) next.add(other)
    if (!on && other >= index) next.delete(other)
  })
  return next
}

/** Recommendations found after the user's last manual tick that are not ticked (spec: manual
 *  ticks keep later finds visible); none while the default ticks follow the search. */
export function newSuggestionKeys(
  keys: readonly string[],
  seen: ReadonlySet<string>,
  ticked: ReadonlySet<string> | null
): string[] {
  if (!ticked) return []
  return keys.filter((key) => !seen.has(key) && !ticked.has(key))
}

/** A unit's goals as one chain: the end progression and rank its steps reach. */
export interface UnitGoalChain {
  unitId: string
  from: LegendaryEventRosterUnit | undefined
  steps: UpgradeStep[]
  request: UpgradeChainRequest
  alreadyPlanned: boolean
}

/** The farming estimate request for a unit's steps from its synced state. */
export function chainRequest(
  unitId: string,
  from: LegendaryEventRosterUnit | undefined,
  steps: readonly UpgradeStep[]
): UpgradeChainRequest {
  let progressionEnd: Progression | undefined
  let rankEnd: Rank | undefined
  for (const step of steps) {
    if (step.kind === "ascension") progressionEnd = step.progression
    if (step.kind === "rank") rankEnd = step.rank
  }
  return {
    unitId,
    from,
    ...(progressionEnd ? { progressionEnd } : {}),
    ...(rankEnd ? { rankEnd } : {}),
  }
}

const stepTarget = (step: UpgradeStep) =>
  step.kind === "rank"
    ? step.rank
    : step.kind === "ascension"
      ? step.progression
      : "unlock"

/** A recommendation's identity across explorations: its unit and the targets of its steps (a
 *  unit's later recommendation continues from its earlier one, so this is unique). */
export const recommendationKey = (recommendation: UpgradeRecommendation) =>
  `${recommendation.unitId}:${recommendation.steps.map(stepTarget).join(">")}`

/**
 * The ticked recommendations grouped by unit, in first-recommended order. Leading steps an Active
 * goal already covers are dropped and the chain starts from the state they reach, so no created
 * goal overlaps an existing one; a chain with nothing left is already planned.
 */
export function goalChains(
  recommendations: readonly UpgradeRecommendation[],
  ticked: ReadonlySet<number>,
  roster: readonly LegendaryEventRosterUnit[],
  isPlanned: (unitId: string, step: UpgradeStep) => boolean
): UnitGoalChain[] {
  const byUnit = new Map<string, UpgradeRecommendation[]>()
  recommendations.forEach((recommendation, index) => {
    if (!ticked.has(index)) return
    byUnit.set(recommendation.unitId, [
      ...(byUnit.get(recommendation.unitId) ?? []),
      recommendation,
    ])
  })
  return [...byUnit].map(([unitId, entries]) => {
    const all = entries.flatMap((entry) => entry.steps)
    const planned = all.findIndex((step) => !isPlanned(unitId, step))
    const done = planned === -1 ? all.length : planned
    const from =
      all[done - 1]?.unit ?? roster.find((unit) => unit.unitId === unitId)
    const steps = all.slice(done)
    return {
      unitId,
      from,
      steps,
      request: chainRequest(unitId, from, steps),
      alreadyPlanned: steps.length === 0,
    }
  })
}

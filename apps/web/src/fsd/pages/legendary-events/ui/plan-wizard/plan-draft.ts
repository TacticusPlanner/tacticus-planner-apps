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

/** The ticked recommendations grouped by unit, in first-recommended order. */
export function goalChains(
  recommendations: readonly UpgradeRecommendation[],
  ticked: ReadonlySet<number>,
  roster: readonly LegendaryEventRosterUnit[]
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
    const from = roster.find((unit) => unit.unitId === unitId)
    const steps = entries.flatMap((entry) => entry.steps)
    return {
      unitId,
      from,
      steps,
      request: chainRequest(unitId, from, steps),
      alreadyPlanned: entries.every((entry) => entry.alreadyPlanned),
    }
  })
}

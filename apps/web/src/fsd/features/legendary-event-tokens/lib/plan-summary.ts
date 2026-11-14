import type {
  AscensionStep,
  LegendaryEventRun,
} from "@/entities/legendary-event"

import type { TokenPlanView } from "./token-plan-view"

/** The run tab's at-a-glance line: the tokens the current run still has and the planned token
 *  that reaches the next character step. */
export interface PlanSummary {
  /** The current run's token supply (tokens in hand plus those still to come this run). */
  tokensLeft: number
  /** The first planned token that reaches a step (1-based, as the Token plan numbers it) and its
   *  run; null when no token a run's supply covers reaches one. */
  nextStep: {
    step: AscensionStep
    token: number
    run: LegendaryEventRun
  } | null
}

export function planSummary(view: TokenPlanView): PlanSummary | null {
  if (view.kind !== "ready" || !view.forecast || !view.byRun) return null
  const current = view.forecast.runs.find(
    (entry) => entry.state === "now" || entry.state === "next"
  )
  if (!current) return null
  const index = view.forecast.markers.findIndex(
    (marker) => marker.steps.length > 0
  )
  const step = view.forecast.markers[index]?.steps[0]
  const section = view.byRun.sections.find(
    (entry) => index >= entry.start && index < entry.start + entry.count
  )
  return {
    tokensLeft: current.supply.total,
    nextStep:
      step && section ? { step, token: index + 1, run: section.run } : null,
  }
}

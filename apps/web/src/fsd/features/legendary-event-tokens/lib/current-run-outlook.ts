import type {
  AscensionStep,
  LegendaryEventRun,
} from "@/entities/legendary-event"

import type { RunForecast } from "./run-forecast"
import type { TokenPlanView } from "./token-plan-view"

/** The run tab's forecast for the run the tokens are spent in next, and the planned token that
 *  reaches the next character step. */
export interface CurrentRunOutlook {
  /** The run in progress, else the next one. */
  run: RunForecast
  /** The first planned token that reaches a step (1-based, as the Token plan numbers it) and its
   *  run; null when no token a run's supply covers reaches one. */
  nextStep: {
    step: AscensionStep
    token: number
    run: LegendaryEventRun
  } | null
}

export function currentRunOutlook(
  view: TokenPlanView
): CurrentRunOutlook | null {
  if (view.kind !== "ready" || !view.forecast || !view.byRun) return null
  const run = view.forecast.runs.find(
    (entry) => entry.state === "now" || entry.state === "next"
  )
  if (!run) return null
  const index = view.forecast.markers.findIndex(
    (marker) => marker.steps.length > 0
  )
  const step = view.forecast.markers[index]?.steps[0]
  const section = view.byRun.sections.find(
    (entry) => index >= entry.start && index < entry.start + entry.count
  )
  return {
    run,
    nextStep:
      step && section ? { step, token: index + 1, run: section.run } : null,
  }
}

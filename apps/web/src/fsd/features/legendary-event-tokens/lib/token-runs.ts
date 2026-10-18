import type { LegendaryEventRun } from "@/entities/legendary-event"

import type { RunSupply, RunSupplyState } from "./token-supply"

/** One run's share of the plan: tokens `start`..`start + count − 1` (plan indexes). */
export interface RunTokenSection {
  run: LegendaryEventRun
  state: Exclude<RunSupplyState, "done">
  /** True for the one Next run of an unknown run: it has no run number to show. */
  unknownRun: boolean
  available: number
  start: number
  count: number
}

export interface PlanByRun {
  sections: RunTokenSection[]
  /** Planned tokens no run's supply covers, from plan index `start`. */
  overflow: { start: number; count: number } | null
}

/**
 * Spends the plan's tokens in order across the runs that are not Done, each up to its supply
 * (spec: run-by-run forecast; design D1). The forecast and the Token plan list both read it, so
 * they never disagree.
 */
export function splitPlanByRun(
  tokenCount: number,
  supply: readonly RunSupply[]
): PlanByRun {
  let next = 0
  const sections: RunTokenSection[] = []
  for (const run of supply) {
    if (run.state === "done") continue
    const count = Math.min(run.total, tokenCount - next)
    sections.push({
      run: run.run,
      state: run.state,
      unknownRun: run.unknownRun,
      available: run.total,
      start: next,
      count,
    })
    next += count
  }
  return {
    sections,
    overflow:
      next < tokenCount ? { start: next, count: tokenCount - next } : null,
  }
}

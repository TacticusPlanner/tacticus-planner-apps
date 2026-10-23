import type { ClearEstimate } from "@/entities/legendary-event"

/** What the depth stepper shows (design D5): the manual depth when one is stored (or there is no
 *  estimate), else the estimate. An estimate of 0 leaves the stepper empty, so + starts at 1. */
export type ClearDepthDisplay =
  | { kind: "manual"; stepperValue: number | null }
  | { kind: "estimate"; stepperValue: number | null; estimate: ClearEstimate }

export function clearDepthDisplay(
  manualDepth: number | null,
  estimate: ClearEstimate | null
): ClearDepthDisplay {
  if (manualDepth !== null || !estimate) {
    return { kind: "manual", stepperValue: manualDepth }
  }
  return {
    kind: "estimate",
    stepperValue: estimate.depth >= 1 ? estimate.depth : null,
    estimate,
  }
}

/** Whether a depth edit started from a shown estimate (the override log, design D8). */
export function editStartsFromEstimate(
  manualDepth: number | null,
  estimate: ClearEstimate | null
): boolean {
  return manualDepth === null && estimate !== null
}

/** The editor footer's depth line (spec: the editor keeps its summary in view): the manual depth,
 *  else the estimate (marked estimated), else unset. */
export type ClearDepthSummary =
  | { kind: "manual"; depth: number }
  | { kind: "estimate"; depth: number }
  | { kind: "unset" }

export function clearDepthSummary(
  manualDepth: number | null,
  estimate: ClearEstimate | null
): ClearDepthSummary {
  if (manualDepth !== null) return { kind: "manual", depth: manualDepth }
  if (estimate) return { kind: "estimate", depth: estimate.depth }
  return { kind: "unset" }
}

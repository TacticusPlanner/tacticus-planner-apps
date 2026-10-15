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

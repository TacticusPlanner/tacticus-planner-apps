import type { AscensionStep } from "@/entities/legendary-event"

import type { StepVerdict } from "./plan-ceiling"
import type { PlanDraft } from "./use-plan-draft"

export type PlanSummaryFacts = {
  step: AscensionStep
  verdict: StepVerdict["kind"]
  /** The verdict is still being rechecked. */
  checking: boolean
  /** Too ambitious once the search is over: the summary shows the warning. */
  tooAmbitious: boolean
} & (
  | { kind: "unreachable" }
  | {
      kind: "points"
      points: number
      /** The ceiling of the ticked upgrades. */
      ceiling: number
    }
)

/** What the plan summary says about the chosen target, or null when nothing is offered. */
export function planSummaryFacts(
  draft: Pick<
    PlanDraft,
    "chosenTarget" | "options" | "evaluation" | "recommendations" | "settling"
  >
): PlanSummaryFacts | null {
  const { chosenTarget } = draft
  if (!chosenTarget) return null
  const option = draft.options.options.find(
    (entry) => entry.target.step === chosenTarget.step
  )
  const verdict = option?.verdict.kind ?? "tooAmbitious"
  const searching =
    draft.recommendations.status === "running" ||
    draft.recommendations.status === "estimating"
  // Upgrades only raise the ceiling, so a step reachable now stays settled while the search runs.
  const checking = draft.settling || (searching && verdict !== "reachableNow")
  const base = {
    step: chosenTarget.step,
    verdict,
    checking,
    tooAmbitious: !checking && verdict === "tooAmbitious",
  }
  return chosenTarget.kind === "points"
    ? {
        ...base,
        kind: "points",
        points: chosenTarget.points,
        ceiling: draft.evaluation.ceiling ?? 0,
      }
    : { ...base, kind: "unreachable" }
}

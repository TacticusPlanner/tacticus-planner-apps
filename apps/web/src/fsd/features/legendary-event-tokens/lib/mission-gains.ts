import {
  UNTRACKED_MISSION_KINDS,
  type LegendaryEventMissionRef,
} from "@/entities/legendary-event"

import type { TokenMissionStep } from "./mission-order"
import type { MissionProgress } from "./token-missions"

/** One mission a token moves, as its missions popover shows it. */
export interface MissionGain {
  ref: LegendaryEventMissionRef
  /** What the play adds (0 when it can't be counted). */
  amount: number
  estimate: boolean
  /** The play finishes the mission (known in the Missions order only). */
  completes: boolean
}

/** The Points order's gains: what the token adds to each current mission it progresses. */
export function gainsFromProgress(
  progress: readonly MissionProgress[]
): MissionGain[] {
  return progress.map((entry) => ({ ...entry, completes: false }))
}

/** The Missions order's gains: each step's added count, and whether it finishes the mission.
 *  Untracked kinds (every battle progresses them) are left out, as in the Points order. */
export function gainsFromSteps(
  steps: readonly TokenMissionStep[]
): MissionGain[] {
  return steps
    .filter((step) => !UNTRACKED_MISSION_KINDS.has(step.ref.mission.kind))
    .map((step) => ({
      ref: step.ref,
      amount: step.gained,
      estimate: step.estimate,
      completes: step.completes,
    }))
}

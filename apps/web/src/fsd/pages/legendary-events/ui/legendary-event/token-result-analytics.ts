import {
  teamPower,
  type LegendaryEventAnnotationStatus,
  type LegendaryEventLaneId,
} from "@/entities/legendary-event"
import {
  depthEstimateContext,
  estimateSnapshot,
  type DepthEstimateContext,
} from "@/features/legendary-event-plan"
import type { AnalyticsEvent } from "@/shared/analytics"

import type { ClearEstimatesViewModel } from "./legendary-event-page.view-model"

/**
 * The estimate a team's player saw on a lane, as a depth edit's context from a Next token card
 * action: the headline, safe and best depths, effective and raw power and the member count (null
 * where the estimates or the roster are unavailable).
 */
export function tokenActionEstimateContext(
  clears: ClearEstimatesViewModel,
  laneId: LegendaryEventLaneId,
  memberUnitIds: readonly string[],
  fromEstimate: boolean
): DepthEstimateContext {
  const lane = clears.kind === "ready" ? clears.byLane[laneId] : undefined
  const inputs = lane?.inputs
  return depthEstimateContext(lane?.team(memberUnitIds) ?? null, {
    fromEstimate,
    teamPower: inputs
      ? teamPower(memberUnitIds, inputs.roster, inputs.config.unitPower)
      : null,
    memberCount: memberUnitIds.length,
    source: "tokenAction",
  })
}

/** The `legendary_event_token_result` event of a Next token card action. */
export function tokenResultEvent(input: {
  eventId: string
  run: number | null
  laneId: LegendaryEventLaneId
  battleIndex: number
  status: LegendaryEventAnnotationStatus
  shown: DepthEstimateContext
  depthBefore: { depth: number | null; estimated: boolean } | undefined
  depthAfter: number | null
  otherTeamReaches: boolean
}): Extract<AnalyticsEvent, { type: "legendary_event_token_result" }> {
  return {
    type: "legendary_event_token_result",
    eventId: input.eventId,
    run: input.run,
    laneId: input.laneId,
    battleIndex: input.battleIndex,
    outcome: input.status === "stopHere" ? "couldNotClear" : "partlyCleared",
    estimate: input.shown.estimate,
    depthBefore: input.depthBefore?.depth ?? null,
    depthBeforeManual: input.depthBefore ? !input.depthBefore.estimated : false,
    depthAfter: input.depthAfter,
    otherTeamReaches: input.otherTeamReaches,
    ...estimateSnapshot(input.shown),
  }
}

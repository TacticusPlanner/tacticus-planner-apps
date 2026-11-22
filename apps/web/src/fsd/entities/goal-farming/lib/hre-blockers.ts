import { required } from "@/shared/lib"

import { shardResourceId } from "../model/estimate.domain"
import type {
  EstimateBlockedReason,
  EstimateBlocker,
  EstimateOutcome,
  EstimateResourceId,
} from "../model/estimate.domain"

/** The blocked reasons that name a Hero Release Event rather than a dead end. */
export type HreBlockedReason = Extract<
  EstimateBlockedReason,
  "HreRunning" | "HreUpcoming"
>

const isHreBlockedReason = (
  reason: EstimateBlockedReason
): reason is HreBlockedReason =>
  reason === "HreRunning" || reason === "HreUpcoming"

/** Whether a blocker is a hero's shards that come from a Hero Release Event. */
export const isHreBlocker = (blocker: EstimateBlocker) =>
  isHreBlockedReason(blocker.reason)

/**
 * A Blocked outcome with each `NoFarmLocation` blocker on a resource in `reasonByResourceId` (a
 * featured hero's shards, `shard:<id>`) relabelled with its Hero Release Event reason. The other
 * blockers move first, so the outcome's `reason` (its first blocker's) names a real dead end
 * whenever there is one. Every other outcome is returned as it is.
 */
export function relabelHreBlockers(
  outcome: EstimateOutcome,
  reasonByResourceId: ReadonlyMap<EstimateResourceId, HreBlockedReason>
): EstimateOutcome {
  if (outcome.status !== "Blocked" || !outcome.blockers) return outcome
  const original = outcome.blockers
  const blockers = original.map((blocker) => {
    const reason =
      blocker.reason === "NoFarmLocation"
        ? reasonByResourceId.get(blocker.resourceId)
        : undefined
    return reason ? { ...blocker, reason } : blocker
  })
  if (blockers.every((blocker, index) => blocker === original[index]))
    return outcome
  const ordered = [
    ...blockers.filter((blocker) => !isHreBlocker(blocker)),
    ...blockers.filter((blocker) => isHreBlocker(blocker)),
  ]
  return {
    ...outcome,
    reason: required(ordered[0], "a blocker").reason,
    resourceIds: ordered.map((blocker) => blocker.resourceId),
    blockers: ordered,
  }
}

/** `relabelHreBlockers` over a plan's outcomes by goal id; the same map when nothing applies. */
export function relabelHreOutcomes(
  outcomes: ReadonlyMap<string, EstimateOutcome>,
  reasonByResourceId: ReadonlyMap<EstimateResourceId, HreBlockedReason>
): ReadonlyMap<string, EstimateOutcome> {
  if (reasonByResourceId.size === 0) return outcomes
  return new Map(
    [...outcomes].map(([goalId, outcome]) => [
      goalId,
      relabelHreBlockers(outcome, reasonByResourceId),
    ])
  )
}

/** Each featured hero's shard id with the reason its running or upcoming HRE gives it. */
export function hreShardReasons(
  sources: Iterable<{
    characterId: string
    status: "running" | "upcoming"
  }>
): Map<EstimateResourceId, HreBlockedReason> {
  const reasons = new Map<EstimateResourceId, HreBlockedReason>()
  for (const { characterId, status } of sources)
    reasons.set(
      shardResourceId(characterId),
      status === "running" ? "HreRunning" : "HreUpcoming"
    )
  return reasons
}

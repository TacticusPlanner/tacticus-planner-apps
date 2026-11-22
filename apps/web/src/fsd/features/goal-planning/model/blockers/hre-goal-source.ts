import type {
  EstimateBlockedReason,
  EstimateOutcome,
} from "@/entities/goal-farming"
import { isHreBlocker } from "@/entities/goal-farming"
import type { HreShardSource } from "@/entities/hre-mission"

/** What a goal's plan estimate contributes to its blocked state, with any HRE it waits on. */
export type EstimateBlockSplit = {
  /** The first blocker that is a real dead end; undefined when nothing blocks the goal or every
   *  blocked resource comes from a Hero Release Event. */
  reason: EstimateBlockedReason | undefined
  /** Obtainable work is still scheduled around the blockers (Restricted, not Blocked). */
  partial: boolean
  /** The running or upcoming Hero Release Event the goal's blocked shards come from. */
  hreSource: HreShardSource | null
}

const SHARD_PREFIX = "shard:"

/**
 * Splits a Blocked estimate into the reason it is blocked and the HRE it waits on: blockers the
 * plan relabelled `HreRunning`/`HreUpcoming` don't block the goal, they name the event its shards
 * come from instead. A goal-wide block (no blockers listed) keeps its reason.
 */
export function splitEstimateBlock(
  outcome: EstimateOutcome | undefined,
  hreSources: ReadonlyMap<string, HreShardSource>
): EstimateBlockSplit {
  if (outcome?.status !== "Blocked")
    return { reason: undefined, partial: false, hreSource: null }
  const partial = (outcome.actionableResourceIds?.length ?? 0) > 0
  if (!outcome.blockers)
    return { reason: outcome.reason, partial, hreSource: null }
  const hreBlocker = outcome.blockers.find((blocker) => isHreBlocker(blocker))
  const deadEnd = outcome.blockers.find((blocker) => !isHreBlocker(blocker))
  const characterId = hreBlocker?.resourceId.startsWith(SHARD_PREFIX)
    ? hreBlocker.resourceId.slice(SHARD_PREFIX.length)
    : undefined
  return {
    reason: deadEnd?.reason,
    partial,
    hreSource: (characterId && hreSources.get(characterId)) || null,
  }
}

import type { BattleId, CampaignId } from "@workspace/game-domain"

import type { Battle, FarmLocation } from "@/shared/lib"

/** A node that drops a resource but that the player can't farm yet, and how far away it is. */
export type FarmUnlockPath =
  | {
      kind: "campaign"
      battleId: BattleId
      /** Battles still to beat, the node itself included, before it can be raided. */
      battlesToGo: number
      /** False when the player has no progress on the node's campaign track at all. */
      started: boolean
    }
  | {
      /** A campaign event's node: farmable only while that event runs and once reached. */
      kind: "event"
      battleId: BattleId
    }

/** A campaign track's progress: `highestCompletedBattleIndex` is the frontier (see
 *  `isStandingBattleReached`). */
type TrackProgress = { highestCompletedBattleIndex: number }

/**
 * The nodes that would let the player farm a resource none of their reachable nodes drops — the
 * "how do I unlock it" answer for a `NoFarmLocation` blocker. Only nodes the farming engine can't
 * use (`eligibleBattleIds` is its battle map) and that actually drop something for energy are
 * listed. A standing-campaign node needs every battle from the track's frontier up to and including
 * itself beaten (the frontier is the next battle not beaten yet, the first battle when the track has
 * no progress), so the closest come first; campaign-event nodes, which depend on the event's
 * schedule rather than on progress, come last. Duplicate locations (guaranteed + potential drops of
 * one node) appear once.
 */
export function farmUnlockPaths(params: {
  farmLocations: readonly FarmLocation[]
  allBattlesById: ReadonlyMap<BattleId, Battle>
  eligibleBattleIds: ReadonlySet<BattleId>
  campaignProgressByKey: ReadonlyMap<string, TrackProgress>
  isEventGroup: (campaignGroupId: CampaignId) => boolean
}): FarmUnlockPath[] {
  const campaign: Extract<FarmUnlockPath, { kind: "campaign" }>[] = []
  const event: Extract<FarmUnlockPath, { kind: "event" }>[] = []
  const seen = new Set<BattleId>()
  for (const location of params.farmLocations) {
    const { battleId } = location
    if (seen.has(battleId) || params.eligibleBattleIds.has(battleId)) continue
    const battle = params.allBattlesById.get(battleId)
    if (!battle || battle.energyCost <= 0 || !dropsSomething(location)) continue
    seen.add(battleId)
    if (params.isEventGroup(battle.campaignGroupId)) {
      event.push({ kind: "event", battleId })
      continue
    }
    const progress = params.campaignProgressByKey.get(
      `${battle.campaignGroupId}:${battle.type}`
    )
    const frontier = progress?.highestCompletedBattleIndex ?? 0
    campaign.push({
      kind: "campaign",
      battleId,
      battlesToGo: Math.max(1, battle.battleIndex - frontier + 1),
      started: progress !== undefined,
    })
  }
  campaign.sort((a, b) => a.battlesToGo - b.battlesToGo)
  return [...campaign, ...event]
}

function dropsSomething(location: FarmLocation): boolean {
  if (location.guaranteed) return true
  if (location.effectiveRate != null) return location.effectiveRate > 0
  return (location.numerator ?? 0) > 0 && (location.denominator ?? 0) > 0
}

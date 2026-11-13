import type { BattleId, CampaignId } from "@workspace/game-domain"

import type { Battle, FarmLocation } from "@/shared/lib"

import {
  campaignTrackGate,
  type CampaignGateContext,
  type CampaignLockReason,
} from "./campaign-track-gate"

/** A node that drops a resource but that the player can't farm yet, and how far away it is. */
export type FarmUnlockPath =
  | {
      kind: "campaign"
      battleId: BattleId
      /** Battles still to beat on the node's own track, the node itself included. */
      battlesToGo: number
      /** Battles left on the campaigns that must be cleared before this track opens. */
      prerequisiteBattles: number
      /** Everything else in the way: missing core heroes, the campaign it follows, Power Level. */
      lockReasons: CampaignLockReason[]
      /** False when the player has no progress on the node's campaign track at all. */
      started: boolean
    }
  | {
      /** A campaign event's node: farmable only while that event runs and once reached. */
      kind: "event"
      battleId: BattleId
    }

/**
 * The nodes that would let the player farm a resource none of their reachable nodes drops — the
 * "how do I unlock it" answer for a `NoFarmLocation` blocker. Only nodes the farming engine can't
 * use (`eligibleBattleIds` is its battle map) and that actually drop something for energy are
 * listed. A standing-campaign node needs every battle from the track's frontier up to and including
 * itself beaten (the frontier is the next battle not beaten yet, the first battle when the track has
 * no progress), plus every campaign the track follows cleared (`campaignTrackGate`). Nodes nothing
 * else stands in front of come first, then those waiting on Power Level, then those needing heroes
 * the player doesn't own, each closest first by total battles; campaign-event nodes, which depend
 * on the event's schedule rather than on progress, come last. Duplicate locations (guaranteed + potential drops of
 * one node) appear once.
 */
export function farmUnlockPaths(params: {
  farmLocations: readonly FarmLocation[]
  allBattlesById: ReadonlyMap<BattleId, Battle>
  eligibleBattleIds: ReadonlySet<BattleId>
  isEventGroup: (campaignGroupId: CampaignId) => boolean
  gate: CampaignGateContext
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
    const progress = params.gate.campaignProgressByKey.get(
      `${battle.campaignGroupId}:${battle.type}`
    )
    const frontier = progress?.highestCompletedBattleIndex ?? 0
    const { lockReasons, prerequisiteBattles } = campaignTrackGate(
      battle.campaignGroupId,
      params.gate
    )
    campaign.push({
      kind: "campaign",
      battleId,
      battlesToGo: Math.max(1, battle.battleIndex - frontier + 1),
      prerequisiteBattles,
      lockReasons,
      started: progress !== undefined,
    })
  }
  campaign.sort(
    (a, b) =>
      lockRank(a) - lockRank(b) || totalBattlesToGo(a) - totalBattlesToGo(b)
  )
  return [...campaign, ...event]
}

/** Battles to beat before the node can be raided: its own track, then the campaigns before it. */
const totalBattlesToGo = (
  path: Pick<
    Extract<FarmUnlockPath, { kind: "campaign" }>,
    "battlesToGo" | "prerequisiteBattles"
  >
) => path.prerequisiteBattles + path.battlesToGo

/** 0 when only battles stand in the way, 1 when Power Level does, 2 when heroes are missing. */
function lockRank(path: Extract<FarmUnlockPath, { kind: "campaign" }>) {
  if (path.lockReasons.some((r) => r.kind === "MissingCoreCharacters")) return 2
  if (path.lockReasons.some((r) => r.kind === "PowerLevelTooLow")) return 1
  return 0
}

function dropsSomething(location: FarmLocation): boolean {
  if (location.guaranteed) return true
  if (location.effectiveRate != null) return location.effectiveRate > 0
  return (location.numerator ?? 0) > 0 && (location.denominator ?? 0) > 0
}

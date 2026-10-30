// Event-campaign eligibility used by use-eligible-campaign-battles.ts and the slice index.
// Event-campaign progress maps come from
// `buildEffectiveCampaignEventProgress` (entities/player-data-override), which merges manual
// overrides over synced progress; the key builder is the entity's own, so the two cannot drift.

import type { PlayerDataChunkDto } from "@workspace/player-data"

import {
  campaignEventTrackKey,
  type EffectiveCampaignEventProgress,
} from "@/entities/player-data-override"
import { isStandingBattleRaidable } from "@/shared/lib"

export type CampaignEventProgressEntry = EffectiveCampaignEventProgress
export const campaignEventProgressKey = campaignEventTrackKey

export type CampaignProgressEntry = {
  highestCompletedBattleIndex: number
}

export function campaignProgressKey(campaignGroupId: string, type: string) {
  return `${campaignGroupId}:${type}`
}

export function buildCampaignProgressByKey(
  entries: readonly PlayerDataChunkDto<"campaign-progress">[number][]
): ReadonlyMap<string, CampaignProgressEntry> {
  return new Map(
    entries.map((progress) => [
      campaignProgressKey(progress.tacticusCampaignId, progress.type),
      { highestCompletedBattleIndex: progress.highestCompletedBattleIndex },
    ])
  )
}

// Whether a standing-campaign battle can be raided, per the `campaign-progress` high-water mark
// (already synced for the Progress page) — the shared `isStandingBattleRaidable` rule, so Today and
// goal estimates gate the same set. `battleIndex` — not `nodeNumber` — is the field this chunk is
// keyed against (see Battle's own doc comment): zero-based, assigned independently within each
// {campaignGroupId, type} track, and covering challenge and non-challenge battles alike.
// `campaign-progress` carries no separate completed-challenge-ids list (unlike
// `campaign-events-progress`), so a challenge battle is gated by this same comparison, not treated as
// reachable in any order.
function isStandingBattleReached<
  TBattle extends {
    campaignGroupId: string
    type: string
    battleIndex: number
  },
>(
  battle: TBattle,
  campaignProgressByKey: ReadonlyMap<string, CampaignProgressEntry>
): boolean {
  const progress = campaignProgressByKey.get(
    campaignProgressKey(battle.campaignGroupId, battle.type)
  )
  return isStandingBattleRaidable(
    battle.battleIndex,
    progress?.highestCompletedBattleIndex
  )
}

// Whether the player has actually reached an event-campaign battle's node, per the
// `campaign-events-progress` high-water mark — a separate, unambiguous signal from
// `live-progress.battleAttempts` (which can't tell Standard/Extremis tiers apart; see
// daily-raids-today spec, "Only the active campaign event is farmable"). Non-challenge nodes are
// numbered sequentially from 1 within each {campaignGroupId, type} track, so reaching node N
// requires having completed nodes 1..N-1; challenge nodes are optional/any-order, so they're gated
// by exact battle-id membership instead. No progress entry at all means the tier hasn't been
// started, i.e. not reached.
function isEventNodeReached<
  TBattle extends {
    id: string
    campaignGroupId: string
    type: string
    challenge: boolean
    nodeNumber: number
  },
>(
  battle: TBattle,
  campaignEventProgressByKey: ReadonlyMap<string, CampaignEventProgressEntry>
): boolean {
  const progress = campaignEventProgressByKey.get(
    campaignEventProgressKey(battle.campaignGroupId, battle.type)
  )
  if (!progress) return false
  if (battle.challenge)
    return progress.completedChallengeBattlesIds.includes(battle.id)
  // A track can have an entry only because of a challenge override (or a legacy all-null one);
  // with neither a synced nor a manual battle count its regular nodes are not reached, not node 1.
  return (
    progress.battleSource !== "none" &&
    battle.nodeNumber <= progress.completedBattleCount + 1
  )
}

export function availableCampaignBattles<
  TBattle extends {
    id: string
    campaignGroupId: string
    type: string
    challenge: boolean
    nodeNumber: number
    battleIndex: number
  },
>(
  battles: TBattle[],
  eventCampaignIds: ReadonlySet<string>,
  activeCampaignEventId: string | null | undefined,
  campaignEventProgressByKey: ReadonlyMap<string, CampaignEventProgressEntry>,
  campaignProgressByKey: ReadonlyMap<string, CampaignProgressEntry> = new Map()
) {
  return battles.filter((battle) => {
    if (!eventCampaignIds.has(battle.campaignGroupId)) {
      return isStandingBattleReached(battle, campaignProgressByKey)
    }
    if (battle.campaignGroupId !== activeCampaignEventId) return false
    return isEventNodeReached(battle, campaignEventProgressByKey)
  })
}

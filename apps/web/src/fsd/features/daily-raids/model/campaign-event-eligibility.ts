// Split out of daily-raids-calc.ts (and, for the two builders below, use-daily-raids.ts) to keep
// those files under this repo's max-lines rule.

import type { PlayerDataChunkDto } from "@workspace/player-data"

export type CampaignEventProgressEntry = {
  completedBattleCount: number
  completedChallengeBattlesIds: readonly string[]
}

export function campaignEventProgressKey(
  campaignGroupId: string,
  type: string
) {
  return `${campaignGroupId}:${type}`
}

export function buildCampaignEventProgressByKey(
  entries: readonly PlayerDataChunkDto<"campaign-events-progress">[number][]
): ReadonlyMap<string, CampaignEventProgressEntry> {
  return new Map(
    entries.map((progress) => [
      campaignEventProgressKey(progress.tacticusCampaignId, progress.type),
      {
        completedBattleCount: progress.completedBattleCount,
        completedChallengeBattlesIds: progress.completedChallengeBattlesIds,
      },
    ])
  )
}

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

// Whether the player has reached a standing-campaign battle's node, per the `campaign-progress`
// high-water mark (already synced for the Progress page). `battleIndex` — not `nodeNumber` — is the
// field this chunk is keyed against (see Battle's own doc comment): zero-based, assigned
// independently within each {campaignGroupId, type} track, and covering challenge and non-challenge
// battles alike. `campaign-progress` carries no separate completed-challenge-ids list (unlike
// `campaign-events-progress`), so a challenge battle is gated by this same comparison, not treated as
// reachable in any order. No progress entry at all means the track hasn't been started, so only
// battleIndex 0 is reachable.
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
  const highestCompletedBattleIndex =
    progress?.highestCompletedBattleIndex ?? -1
  return battle.battleIndex <= highestCompletedBattleIndex + 1
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
  return battle.challenge
    ? progress.completedChallengeBattlesIds.includes(battle.id)
    : battle.nodeNumber <= progress.completedBattleCount + 1
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

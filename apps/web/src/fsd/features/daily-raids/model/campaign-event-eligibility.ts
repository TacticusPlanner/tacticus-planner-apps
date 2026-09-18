// Split out of daily-raids-calc.ts to keep that file under this repo's max-lines rule.

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
  },
>(
  battles: TBattle[],
  eventCampaignIds: ReadonlySet<string>,
  activeCampaignEventId: string | null | undefined,
  campaignEventProgressByKey: ReadonlyMap<string, CampaignEventProgressEntry>
) {
  return battles.filter((battle) => {
    if (!eventCampaignIds.has(battle.campaignGroupId)) return true
    if (battle.campaignGroupId !== activeCampaignEventId) return false
    return isEventNodeReached(battle, campaignEventProgressByKey)
  })
}

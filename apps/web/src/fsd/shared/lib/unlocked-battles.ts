import type { Battle } from "./battle.domain"

/** One synced `campaign-progress` entry: the high-water mark of a {campaign, type} track. */
type CampaignProgress = {
  tacticusCampaignId: string
  type: string
  highestCompletedBattleIndex: number
}

/**
 * Keeps only the standing-campaign battles the player has unlocked (V1 `populateLocationsData`:
 * node <= campaign progress), so every estimate consumer picks farm nodes from the same set.
 * A battle is unlocked when its zero-based `battleIndex` is at most the track's highest completed
 * index + 1; a track with no progress entry has only index 0 unlocked. Event campaigns are not
 * gated here (their own eligibility rules live with the daily raids feature).
 */
export function filterUnlockedBattles<TKey, TBattle extends Battle>(
  battlesById: ReadonlyMap<TKey, TBattle>,
  progress: readonly CampaignProgress[],
  eventCampaignIds: ReadonlySet<string>
): Map<TKey, TBattle> {
  const highest = new Map(
    progress.map((entry) => [
      `${entry.tacticusCampaignId}:${entry.type}`,
      entry.highestCompletedBattleIndex,
    ])
  )
  return new Map(
    [...battlesById].filter(
      ([, battle]) =>
        eventCampaignIds.has(battle.campaignGroupId) ||
        battle.battleIndex <=
          (highest.get(`${battle.campaignGroupId}:${battle.type}`) ?? -1) + 1
    )
  )
}

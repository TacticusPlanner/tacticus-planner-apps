import type { Battle } from "./battle.domain"

/** One synced `campaign-progress` entry: the high-water mark of a {campaign, type} track. */
type CampaignProgress = {
  tacticusCampaignId: string
  type: string
  highestCompletedBattleIndex: number
}

/**
 * Whether a standing-campaign battle can be raided. The synced `highestCompletedBattleIndex` is the
 * highest index in the Tacticus API's `battles[]` list, which runs up to and including the
 * *frontier* battle: the one not yet beaten with 3 medals (or the empty index past the last battle
 * once a track is finished). The API carries no medal data, so — matching V1 (`nodeNumber <=
 * battles.length - 1`) — only battles strictly before the frontier count as raidable; the frontier
 * itself may be unplayed or beaten with fewer than 3 medals. No progress entry means nothing is
 * raidable yet.
 */
export function isStandingBattleRaidable(
  battleIndex: number,
  highestCompletedBattleIndex: number | undefined
): boolean {
  return battleIndex < (highestCompletedBattleIndex ?? 0)
}

/**
 * Keeps only the standing-campaign battles the player can raid (see `isStandingBattleRaidable`), so
 * every estimate consumer picks farm nodes from the same set. Event campaigns are not gated here
 * (their own eligibility rules live with the daily raids feature).
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
        isStandingBattleRaidable(
          battle.battleIndex,
          highest.get(`${battle.campaignGroupId}:${battle.type}`)
        )
    )
  )
}

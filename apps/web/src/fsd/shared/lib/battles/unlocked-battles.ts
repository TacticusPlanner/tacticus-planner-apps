import type { Battle } from "./battle.domain"

/** One synced `campaign-progress` entry: the high-water mark of a {campaign, type} track. */
type CampaignProgress = {
  tacticusCampaignId: string
  type: string
  highestCompletedBattleIndex: number
}

/**
 * Whether the player has reached a standing-campaign battle, so it can be played. The synced
 * `highestCompletedBattleIndex` is the highest index in the Tacticus API's `battles[]` list, which
 * runs up to and including the *frontier*: the next battle not beaten yet (or the empty index past
 * the last battle once a track is finished). No progress entry means the track hasn't started.
 */
export function isStandingBattleReached(
  battleIndex: number,
  highestCompletedBattleIndex: number | undefined
): boolean {
  return battleIndex <= (highestCompletedBattleIndex ?? -1)
}

/**
 * Whether a reached standing battle is the frontier: playable but never beaten, so it can't be
 * raided yet. The API carries no medal data, so this is the only manual battle it reveals; battles
 * beaten with fewer than 3 medals come from the player's battle progress overrides.
 */
export function isStandingBattleFrontier(
  battleIndex: number,
  highestCompletedBattleIndex: number | undefined
): boolean {
  return battleIndex === highestCompletedBattleIndex
}

/**
 * Keeps only the standing-campaign battles the player has reached (see `isStandingBattleReached`),
 * so every estimate consumer picks farm nodes from the same set. The frontier is kept: it is a
 * manual battle, not a locked one. Event campaigns are not gated here
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
        isStandingBattleReached(
          battle.battleIndex,
          highest.get(`${battle.campaignGroupId}:${battle.type}`)
        )
    )
  )
}

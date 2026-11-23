import type { CampaignEventProgressOverride } from "./types"

/** Where an effective campaign-event value came from. */
export type CampaignEventProgressSource = "manual" | "synced" | "none"

/** The synced `campaign-events-progress` fields this resolution reads. */
export type SyncedCampaignEventProgress = {
  tacticusCampaignId: string
  type: string
  completedBattleCount: number
  completedChallengeBattlesIds: readonly string[]
}

export type EffectiveCampaignEventProgress = {
  completedBattleCount: number
  completedChallengeBattlesIds: readonly string[]
  battleSource: CampaignEventProgressSource
  challengeSource: CampaignEventProgressSource
  /** The synced battle count, or null with no synced data: the floor a manual count must beat. */
  syncedBattleCount: number | null
}

/** One `{campaignGroupId, type}` track's key, shared by the page and daily raids. */
export function campaignEventTrackKey(campaignGroupId: string, type: string) {
  return `${campaignGroupId}:${type}`
}

/**
 * Resolves one track's effective progress. Battle count and challenge ids resolve independently,
 * since an override may set either one and leave the other null.
 *
 * - Battle count: the manual override when it is above the synced count (or nothing is synced),
 *   else the synced count, else 0. The game only reports battles the player has beaten, so a synced
 *   count above the manual one means the override is stale (for example a V1 import or a value set
 *   in an earlier event run); it must not hide event nodes the player has since reached.
 * - Challenge ids: the manual override when it is not null, else the synced ids, else none.
 */
export function resolveCampaignEventProgress(
  synced: SyncedCampaignEventProgress | undefined,
  override: CampaignEventProgressOverride | undefined
): EffectiveCampaignEventProgress {
  const manualCount = override?.completedBattleCount ?? null
  const manualChallenges = override?.completedChallengeBattlesIds ?? null
  const syncedCount = synced?.completedBattleCount ?? null
  const manualCountWins =
    manualCount !== null && (syncedCount === null || manualCount > syncedCount)
  return {
    completedBattleCount: manualCountWins ? manualCount : (syncedCount ?? 0),
    completedChallengeBattlesIds:
      manualChallenges ?? synced?.completedChallengeBattlesIds ?? [],
    battleSource: sourceOf(manualCountWins, synced),
    challengeSource: sourceOf(manualChallenges !== null, synced),
    syncedBattleCount: syncedCount,
  }
}

const sourceOf = (
  manual: boolean,
  synced: SyncedCampaignEventProgress | undefined
): CampaignEventProgressSource =>
  manual ? "manual" : synced ? "synced" : "none"

/**
 * Effective progress for every track that has synced data or an override, keyed by
 * `campaignEventTrackKey`. A track with neither is absent, which callers treat as no progress.
 */
export function buildEffectiveCampaignEventProgress(
  synced: readonly SyncedCampaignEventProgress[],
  overrides: readonly CampaignEventProgressOverride[]
): ReadonlyMap<string, EffectiveCampaignEventProgress> {
  const syncedByKey = new Map(
    synced.map((entry) => [
      campaignEventTrackKey(entry.tacticusCampaignId, entry.type),
      entry,
    ])
  )
  const overrideByKey = new Map(
    overrides.map((entry) => [
      campaignEventTrackKey(entry.campaignGroupId, entry.type),
      entry,
    ])
  )
  const keys = new Set([...syncedByKey.keys(), ...overrideByKey.keys()])
  return new Map(
    [...keys].map((key) => [
      key,
      resolveCampaignEventProgress(
        syncedByKey.get(key),
        overrideByKey.get(key)
      ),
    ])
  )
}

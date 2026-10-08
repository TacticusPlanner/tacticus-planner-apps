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
}

/** One `{campaignGroupId, type}` track's key, shared by the page and daily raids. */
export function campaignEventTrackKey(campaignGroupId: string, type: string) {
  return `${campaignGroupId}:${type}`
}

/**
 * Resolves one track's effective progress: the manual override value when it is not null, else the
 * synced value, else no progress. Battle count and challenge ids resolve independently, since an
 * override may set either one and leave the other null.
 */
export function resolveCampaignEventProgress(
  synced: SyncedCampaignEventProgress | undefined,
  override: CampaignEventProgressOverride | undefined
): EffectiveCampaignEventProgress {
  const manualCount = override?.completedBattleCount ?? null
  const manualChallenges = override?.completedChallengeBattlesIds ?? null
  return {
    completedBattleCount: manualCount ?? synced?.completedBattleCount ?? 0,
    completedChallengeBattlesIds:
      manualChallenges ?? synced?.completedChallengeBattlesIds ?? [],
    battleSource: sourceOf(manualCount !== null, synced),
    challengeSource: sourceOf(manualChallenges !== null, synced),
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

import type { PlayerDataChunkPayload } from "./types"

// Manual/override shapes mirror the backend's `PlayerDataOverride` entity (see ADR 0007 in the docs
// repo): they are never synced from the Tacticus API and are supplied by whatever future
// override-editing feature/storage populates them — this module only defines how they combine with
// synced data, not where they come from, so that concern can be built later without coupling here.

export type BattleResultOverride = {
  tacticusCampaignId: string
  battleIndex: number
  medal: 1 | 2 | 3
  lightningVictory: boolean
  victoryWithoutBorrowed: boolean | null
}

export type CampaignProgressOverride = {
  catalogCampaignGroupId: string
  highestCompletedNodeNumber: number
}

export type EffectiveBattleResult = {
  battleIndex: number
  medal: 1 | 2 | 3
  lightningVictory: boolean
  victoryWithoutBorrowed: boolean | null
  isOverridden: boolean
}

type CampaignProgress = PlayerDataChunkPayload<"campaign-progress">[number]

/**
 * Resolves the effective result for every battle the player has synced progress for in one campaign,
 * applying any matching override. Per ADR 0007: absent an override, a battle assumes the maximum
 * possible result — full medals, and (for campaign-event battles) every applicable completion flag.
 */
export function getEffectiveBattleResults(
  campaign: CampaignProgress,
  overrides: readonly BattleResultOverride[]
): EffectiveBattleResult[] {
  const isEventCampaign =
    campaign.tacticusCampaignId.startsWith("eventCampaign")
  const overrideByBattleIndex = new Map(
    overrides
      .filter(
        (override) =>
          override.tacticusCampaignId === campaign.tacticusCampaignId
      )
      .map((override) => [override.battleIndex, override])
  )

  return campaign.battles.map((battle) => {
    const override = overrideByBattleIndex.get(battle.battleIndex)

    if (override) {
      return {
        battleIndex: battle.battleIndex,
        medal: override.medal,
        lightningVictory: override.lightningVictory,
        victoryWithoutBorrowed: override.victoryWithoutBorrowed,
        isOverridden: true,
      }
    }

    return {
      battleIndex: battle.battleIndex,
      medal: 3,
      lightningVictory: true,
      victoryWithoutBorrowed: isEventCampaign ? true : null,
      isOverridden: false,
    }
  })
}

export type EffectiveCampaignProgress = CampaignProgress & {
  source: "synced" | "manual"
}

/**
 * Combines synced campaign progress with manual entries for campaigns the sync doesn't cover for this
 * player (e.g. a non-currently-selected campaign) — synced entries always win by catalog group id;
 * manual entries only fill gaps, never overwrite synced data.
 */
export function getEffectiveCampaignProgress(
  synced: readonly CampaignProgress[],
  overrides: readonly CampaignProgressOverride[]
): EffectiveCampaignProgress[] {
  const syncedGroupIds = new Set(
    synced
      .map((campaign) => campaign.catalogCampaignGroupId)
      .filter((groupId): groupId is string => groupId !== null)
  )

  const manualOnly = overrides
    .filter((override) => !syncedGroupIds.has(override.catalogCampaignGroupId))
    .map((override): EffectiveCampaignProgress => ({
      tacticusCampaignId: override.catalogCampaignGroupId,
      catalogCampaignGroupId: override.catalogCampaignGroupId,
      name: "",
      type: "",
      battles: [],
      highestObservedBattleIndex: override.highestCompletedNodeNumber,
      source: "manual",
    }))

  return [
    ...synced.map((campaign): EffectiveCampaignProgress => ({
      ...campaign,
      source: "synced",
    })),
    ...manualOnly,
  ]
}

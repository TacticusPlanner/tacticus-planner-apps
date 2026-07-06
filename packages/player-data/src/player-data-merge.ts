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
type BattleAttempt =
  PlayerDataChunkPayload<"live-progress">["battleAttempts"][number]

/**
 * Resolves the effective result for every synced battle attempt in one campaign (from the
 * `live-progress` chunk's `battleAttempts` — campaign identity no longer carries its own battle
 * list, see `CampaignProgress`), applying any matching override. Per ADR 0007: absent an override,
 * a battle assumes the maximum possible result — full medals, and (for campaign-event battles)
 * every applicable completion flag.
 */
export function getEffectiveBattleResults(
  tacticusCampaignId: string,
  battleAttempts: readonly BattleAttempt[],
  overrides: readonly BattleResultOverride[]
): EffectiveBattleResult[] {
  const isEventCampaign = tacticusCampaignId.startsWith("eventCampaign")
  const overrideByBattleIndex = new Map(
    overrides
      .filter((override) => override.tacticusCampaignId === tacticusCampaignId)
      .map((override) => [override.battleIndex, override])
  )

  return battleAttempts
    .filter((battle) => battle.tacticusCampaignId === tacticusCampaignId)
    .map((battle) => {
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
 * player (e.g. a non-currently-selected campaign) — synced entries always win by
 * `tacticusCampaignId` (itself also the catalog group id, see `CampaignProgress`); manual entries
 * only fill gaps, never overwrite synced data.
 */
export function getEffectiveCampaignProgress(
  synced: readonly CampaignProgress[],
  overrides: readonly CampaignProgressOverride[]
): EffectiveCampaignProgress[] {
  const syncedIds = new Set(
    synced.map((campaign) => campaign.tacticusCampaignId)
  )

  const manualOnly = overrides
    .filter((override) => !syncedIds.has(override.catalogCampaignGroupId))
    .map((override): EffectiveCampaignProgress => ({
      tacticusCampaignId: override.catalogCampaignGroupId,
      type: "",
      highestCompletedBattleIndex: override.highestCompletedNodeNumber,
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

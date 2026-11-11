import { useMemo } from "react"
import { campaignDescriptor } from "@workspace/game-catalog"
import type { CampaignId } from "@workspace/game-domain"

import { useCatalogDataset, usePlayerChunk } from "@/shared/local-data"

import { chunkOrUndefined, readyData } from "../shared/read-data"
import { useGoalCatalog } from "../shared/use-goal-catalog"
import {
  lastIndexByTrack,
  type CampaignGateContext,
  type GateCampaignDefinition,
} from "./campaign-track-gate"

/** Elite campaigns are the ones the game gates on Power Level. */
const isEliteCampaign = (campaignGroupId: CampaignId) =>
  campaignDescriptor(campaignGroupId, "Elite")?.difficultyToken === "elite"

/**
 * The player and catalog facts `campaignTrackGate` reads: who they own, their Power Level, the
 * game's Elite threshold, campaign definitions and progress. Fields the player hasn't synced stay
 * undefined, which skips that check rather than reporting a lock.
 */
export function useCampaignGateContext(): CampaignGateContext {
  const { allBattlesById, campaignProgressByKey, campaignDefinitions } =
    useGoalCatalog()
  const ownedUnitIds = readyData(usePlayerChunk("characters", toOwnedUnitIds))
  const powerLevel = readyData(
    usePlayerChunk("player-details", chunkOrUndefined)
  )?.powerLevel
  const eliteCampaignMinPowerLevel = readyData(
    useCatalogDataset("global-values", toEliteCampaignMinPowerLevel)
  )
  const definitionsByGroupId = useMemo(
    () =>
      new Map<string, GateCampaignDefinition>(
        (campaignDefinitions ?? []).map((definition) => [
          definition.groupId,
          definition,
        ])
      ),
    [campaignDefinitions]
  )
  const lastIndexByKey = useMemo(
    () => lastIndexByTrack(allBattlesById, definitionsByGroupId),
    [allBattlesById, definitionsByGroupId]
  )
  return useMemo(
    () => ({
      lastIndexByKey,
      campaignProgressByKey,
      definitionsByGroupId,
      ownedUnitIds,
      powerLevel,
      eliteCampaignMinPowerLevel,
      isElite: isEliteCampaign,
    }),
    [
      lastIndexByKey,
      campaignProgressByKey,
      definitionsByGroupId,
      ownedUnitIds,
      powerLevel,
      eliteCampaignMinPowerLevel,
    ]
  )
}

const toOwnedUnitIds = (
  characters: readonly { unitId: string }[] | null | undefined
) => new Set((characters ?? []).map((character) => character.unitId))

const toEliteCampaignMinPowerLevel = (
  values: readonly { eliteCampaignMinPowerLevel?: number }[]
) => values[0]?.eliteCampaignMinPowerLevel

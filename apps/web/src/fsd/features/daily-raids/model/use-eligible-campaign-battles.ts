import { useMemo } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import type { CampaignDefinitionStorageModel } from "@workspace/game-catalog"
import type { CampaignBattleStorageModel } from "@workspace/game-catalog"
import {
  getCampaignEventProgress,
  getCampaignProgress,
  getLiveProgress,
} from "@workspace/player-data/queries"

import {
  availableCampaignBattles,
  buildCampaignEventProgressByKey,
  buildCampaignProgressByKey,
} from "./campaign-event-eligibility"

/**
 * The single place that reads the live-progress, campaign-events-progress and campaign-progress
 * chunks and applies `availableCampaignBattles`, so Today, Raids Plan and the Goals catalog choose
 * farm nodes from the same set. Until a chunk loads it counts as empty: event nodes are ineligible
 * and only the first standing node of each track is reachable (no false date before hydration).
 * The raw results are returned so callers can tell whether hydration finished.
 */
export function useEligibleCampaignBattles(
  battles: CampaignBattleStorageModel[] | undefined,
  campaignDefinitions: CampaignDefinitionStorageModel[] | undefined
) {
  const liveProgressResult = useLiveQuery(
    async () => ({ value: await getLiveProgress() }),
    []
  )
  const campaignEventProgressResult = useLiveQuery(
    async () => ({ value: await getCampaignEventProgress() }),
    []
  )
  const campaignProgressResult = useLiveQuery(
    async () => ({ value: await getCampaignProgress() }),
    []
  )
  const eventCampaignIds = useMemo(
    () =>
      new Set(
        (campaignDefinitions ?? [])
          .filter((definition) => definition.releaseType === "event")
          .map((definition) => definition.groupId)
      ),
    [campaignDefinitions]
  )
  const campaignEventProgressByKey = useMemo(
    () =>
      buildCampaignEventProgressByKey(campaignEventProgressResult?.value ?? []),
    [campaignEventProgressResult]
  )
  const campaignProgressByKey = useMemo(
    () => buildCampaignProgressByKey(campaignProgressResult?.value ?? []),
    [campaignProgressResult]
  )
  const availableBattles = useMemo(
    () =>
      availableCampaignBattles(
        battles ?? [],
        eventCampaignIds,
        liveProgressResult?.value?.activeCampaignEventId,
        campaignEventProgressByKey,
        campaignProgressByKey
      ),
    [
      battles,
      eventCampaignIds,
      liveProgressResult,
      campaignEventProgressByKey,
      campaignProgressByKey,
    ]
  )
  return {
    availableBattles,
    liveProgressResult,
    campaignEventProgressResult,
    campaignProgressResult,
  }
}

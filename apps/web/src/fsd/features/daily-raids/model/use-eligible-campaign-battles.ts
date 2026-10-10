import { useMemo } from "react"
import { useIsAuthenticated } from "@azure/msal-react"
import { useLiveQuery } from "dexie-react-hooks"
import type { CampaignDefinitionStorageModel } from "@workspace/game-catalog"
import type { CampaignBattleStorageModel } from "@workspace/game-catalog"
import {
  getCampaignProgress,
  getLiveProgress,
} from "@workspace/player-data/queries"

import {
  availableCampaignBattles,
  buildCampaignProgressByKey,
} from "./campaign-event-eligibility"
import { useEffectiveCampaignEventProgress } from "./use-effective-campaign-event-progress"

/**
 * The single place that reads the live-progress, campaign-events-progress (with the player's
 * manual overrides merged over it) and campaign-progress chunks and applies
 * `availableCampaignBattles`, so Today, Raids Plan and the Goals catalog choose farm nodes from the
 * same set. Until a chunk loads it counts as empty: event nodes are ineligible and only the first
 * standing node of each track is reachable (no false date before hydration). The raw results and
 * readiness flags are returned so callers can tell whether hydration finished.
 */
export function useEligibleCampaignBattles(
  battles: CampaignBattleStorageModel[] | undefined,
  campaignDefinitions: CampaignDefinitionStorageModel[] | undefined
) {
  const isAuthenticated = useIsAuthenticated()
  const liveProgressResult = useLiveQuery(
    async () => ({ value: await getLiveProgress() }),
    []
  )
  const campaignEventProgress =
    useEffectiveCampaignEventProgress(isAuthenticated)
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
  const campaignEventProgressByKey = campaignEventProgress.byKey
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
    campaignEventProgressReady: campaignEventProgress.ready,
    campaignEventProgressError: campaignEventProgress.isError,
    campaignProgressResult,
  }
}

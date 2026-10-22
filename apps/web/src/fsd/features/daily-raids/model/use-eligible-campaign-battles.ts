import { useMemo } from "react"
import { useIsAuthenticated } from "@azure/msal-react"
import type { CampaignDefinitionStorageModel } from "@workspace/game-catalog"
import type { CampaignBattleStorageModel } from "@workspace/game-catalog"

import { usePlayerChunk } from "@/shared/local-data"

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
 * standing node of each track is reachable (no false date before hydration). `liveProgress`
 * (undefined until read, null before its first sync), `ready` and `isError` (a failed chunk read or
 * override load) let callers tell whether hydration finished.
 */
export function useEligibleCampaignBattles(
  battles: CampaignBattleStorageModel[] | undefined,
  campaignDefinitions: CampaignDefinitionStorageModel[] | undefined
) {
  const isAuthenticated = useIsAuthenticated()
  const liveProgressRead = usePlayerChunk("live-progress")
  const campaignEventProgress =
    useEffectiveCampaignEventProgress(isAuthenticated)
  const campaignProgressRead = usePlayerChunk("campaign-progress")
  const liveProgress =
    liveProgressRead.status === "ready" ? liveProgressRead.data : undefined
  const campaignProgress =
    campaignProgressRead.status === "ready"
      ? campaignProgressRead.data
      : undefined
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
    () => buildCampaignProgressByKey(campaignProgress ?? []),
    [campaignProgress]
  )
  const availableBattles = useMemo(
    () =>
      availableCampaignBattles(
        battles ?? [],
        eventCampaignIds,
        liveProgress?.activeCampaignEventId,
        campaignEventProgressByKey,
        campaignProgressByKey
      ),
    [
      battles,
      eventCampaignIds,
      liveProgress,
      campaignEventProgressByKey,
      campaignProgressByKey,
    ]
  )
  return {
    availableBattles,
    liveProgress,
    ready:
      liveProgressRead.status === "ready" &&
      campaignProgressRead.status === "ready" &&
      campaignEventProgress.ready,
    isError:
      liveProgressRead.status === "error" ||
      campaignProgressRead.status === "error" ||
      campaignEventProgress.isError,
  }
}

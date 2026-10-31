import { useMemo } from "react"
import { useIsAuthenticated } from "@azure/msal-react"
import type {
  CampaignDefinitionStorageModel,
  CampaignBattleStorageModel,
} from "@workspace/game-catalog"
import { useFeatureFlag } from "@/shared/feature-flags"
import { usePlayerChunk } from "@/shared/local-data"
import {
  availableCampaignBattles,
  buildCampaignProgressByKey,
  manualBattleIds,
} from "./campaign-event-eligibility"
import { useQuery } from "@tanstack/react-query"
import {
  battleProgressQueries,
  buildEffectiveCampaignEventProgress,
  campaignEventProgressQueries,
} from "@/entities/player-data-override"

/**
 * The single place that reads the live-progress, campaign-events-progress (with the player's
 * manual overrides merged over it) and campaign-progress chunks and applies
 * `availableCampaignBattles`, so Today, Raids Plan and the Goals catalog choose farm nodes from the
 * same set. `manualBattleIds` are the eligible battles that must be played, not raided (the standing
 * frontiers plus the player's battle progress overrides below 3 medals); a failed override load
 * leaves only the frontiers manual rather than blocking planning. Until a chunk loads it counts as empty: event nodes are ineligible and only the first
 * standing node of each track is reachable (no false date before hydration). `liveProgress`
 * (undefined until read, null before its first sync), `ready` and `isError` (a failed chunk read or
 * override load) let callers tell whether hydration finished.
 *
 * While the `ManualBattles` flag is off, the manual battles are left out instead (the frontiers stay
 * locked, as before the feature) and none is marked, so no "Play manually" UI shows.
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
  const manualBattlesEnabled = useFeatureFlag("ManualBattles")
  const battleOverridesQuery = useQuery({
    ...battleProgressQueries.current(),
    enabled: isAuthenticated && manualBattlesEnabled,
  })
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
  const reachedBattles = useMemo(
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
  const battleOverrides = battleOverridesQuery.data?.battles
  const manualIds = useMemo(
    () =>
      manualBattleIds(
        reachedBattles,
        eventCampaignIds,
        campaignProgressByKey,
        battleOverrides ?? []
      ),
    [reachedBattles, eventCampaignIds, campaignProgressByKey, battleOverrides]
  )
  const availableBattles = useMemo(
    () =>
      manualBattlesEnabled
        ? reachedBattles
        : reachedBattles.filter((battle) => !manualIds.has(battle.id)),
    [manualBattlesEnabled, reachedBattles, manualIds]
  )
  return {
    availableBattles,
    manualBattleIds: manualBattlesEnabled ? manualIds : NO_MANUAL_BATTLES,
    liveProgress,
    ready:
      liveProgressRead.status === "ready" &&
      campaignProgressRead.status === "ready" &&
      campaignEventProgress.ready &&
      (!isAuthenticated ||
        !manualBattlesEnabled ||
        battleOverridesQuery.isSuccess ||
        battleOverridesQuery.isError),
    isError:
      liveProgressRead.status === "error" ||
      campaignProgressRead.status === "error" ||
      campaignEventProgress.isError,
  }
}

const NO_MANUAL_BATTLES: ReadonlySet<string> = new Set()

/**
 * Event-campaign progress for raid eligibility: the player's manual overrides from the Progress
 * page merged over synced `campaign-events-progress` (daily-raids-today, "Only the active campaign
 * event is farmable"). `ready` waits for synced progress and, when signed in, for the override load
 * to settle; a failed load falls back to synced-only and is reported through `isError`, as is a
 * failed local read of the synced chunk (which never becomes `ready`).
 * `useDailyRaids` treats it as an error, so Today, Raids Plan and the Home raids widget and
 * event-farm section show their error state; only the Home event tab
 * (`useHomeScreenEventLocations`), which has no error state, keeps the synced-only view.
 */
function useEffectiveCampaignEventProgress(isAuthenticated: boolean) {
  const synced = usePlayerChunk("campaign-events-progress")
  const syncedProgress = synced.status === "ready" ? synced.data : undefined
  const overridesQuery = useQuery({
    ...campaignEventProgressQueries.current(),
    enabled: isAuthenticated,
  })
  const byKey = useMemo(
    () =>
      buildEffectiveCampaignEventProgress(
        syncedProgress ?? [],
        overridesQuery.data?.progress ?? []
      ),
    [syncedProgress, overridesQuery.data]
  )
  return {
    byKey,
    ready:
      synced.status === "ready" &&
      (!isAuthenticated || overridesQuery.isSuccess || overridesQuery.isError),
    isError: overridesQuery.isError || synced.status === "error",
  }
}

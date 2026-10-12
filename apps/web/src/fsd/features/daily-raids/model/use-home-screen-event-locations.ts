import { useMemo } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import type { BattleId } from "@workspace/game-domain"
import {
  getCampaignBattles,
  getCampaignDefinitions,
  getNpcsMap,
} from "@workspace/game-catalog/queries"

import { mapCampaignBattleStorageToDomain } from "@/features/rank-lookup/@x/daily-raids"
import { useCampaignDisplay } from "@/shared/lib"

import { buildLocationsByBattleId } from "./daily-raid-locations"
import {
  buildAttemptsLeftByBattle,
  buildBattleAttemptIndex,
  buildTodaysAttempts,
} from "./daily-raids-energy"
import type {
  DailyRaidBattleResource,
  DailyRaidLocationViewModel,
} from "./daily-raids.domain"
import {
  selectTopEventLocations,
  type TopEventLocation,
} from "./home-screen-event-locations"
import { battleEventPoints } from "./home-screen-event-rules"
import { buildRaidsFilterBattles } from "./raids-filters/campaign-type"
import { passLocationFilter } from "./raids-filters/pass-location-filter"
import { useRaidsFilters } from "./raids-filters/use-raids-filters"
import { useResourceByBattleId } from "./use-resource-by-battle-id"
import { useEligibleCampaignBattles } from "./use-eligible-campaign-battles"

export type HomeScreenEventLocationsState =
  | { status: "loading" }
  | {
      status: "ready"
      /** Top locations over every eligible battle, standing campaigns plus the active event's. */
      overall: TopEventLocation[]
      /** Top locations of the active campaign event only; null without an `activeCampaignEventId`. */
      eventCampaign: TopEventLocation[] | null
      locationsByBattleId: ReadonlyMap<BattleId, DailyRaidLocationViewModel>
      resourceByBattleId: ReadonlyMap<BattleId, DailyRaidBattleResource>
    }

/**
 * The two "best locations for event points" lists of the Dailies > HSE tab. They ignore goals but
 * honor the persisted Raids Filters (evaluated without a material), skip locked locations (the
 * shared eligibility, which only admits event-campaign nodes while their campaign is the active
 * campaign event) and locations already raided today.
 */
export function useHomeScreenEventLocations(
  definitionId: string
): HomeScreenEventLocationsState {
  const {
    name: campaignDisplayName,
    tierLabel: campaignTierLabel,
    shortLabel: campaignShortLabel,
  } = useCampaignDisplay()
  const battles = useLiveQuery(() => getCampaignBattles(), [])
  const campaignDefinitions = useLiveQuery(() => getCampaignDefinitions(), [])
  const npcsById = useLiveQuery(() => getNpcsMap(), [])
  const {
    availableBattles,
    liveProgressResult,
    campaignEventProgressReady,
    campaignProgressResult,
  } = useEligibleCampaignBattles(battles, campaignDefinitions)
  const [filters] = useRaidsFilters()
  const resourceByBattleId = useResourceByBattleId()

  const filterBattlesById = useMemo(
    () =>
      buildRaidsFilterBattles(
        battles ?? [],
        campaignDefinitions ?? [],
        npcsById
      ),
    [battles, campaignDefinitions, npcsById]
  )
  const allBattlesById = useMemo(
    () =>
      new Map(
        (battles ?? []).map((battle) => [
          battle.id as BattleId,
          mapCampaignBattleStorageToDomain(battle),
        ])
      ),
    [battles]
  )
  const locationsByBattleId = useMemo(
    () =>
      buildLocationsByBattleId(allBattlesById, {
        name: campaignDisplayName,
        tierLabel: campaignTierLabel,
        shortLabel: campaignShortLabel,
      }),
    [allBattlesById, campaignDisplayName, campaignTierLabel, campaignShortLabel]
  )
  const pointsByBattleId = useMemo(
    () =>
      new Map(
        availableBattles.map((battle) => [
          battle.id,
          battleEventPoints(definitionId, battle, npcsById ?? new Map()),
        ])
      ),
    [availableBattles, definitionId, npcsById]
  )
  const raidedToday = useMemo(() => {
    const attempts = liveProgressResult?.value?.battleAttempts ?? []
    const index = buildBattleAttemptIndex(allBattlesById)
    const exhausted = buildAttemptsLeftByBattle(attempts, index)
    return new Set<string>([
      ...buildTodaysAttempts(attempts, index).map(
        (attempt) => attempt.battleId
      ),
      ...[...exhausted].filter(([, left]) => left === 0).map(([id]) => id),
    ])
  }, [liveProgressResult, allBattlesById])

  const lists = useMemo(() => {
    const passesFilter = (battleId: string) => {
      const battle = filterBattlesById.get(battleId)
      return !battle || passLocationFilter(battle, filters)
    }
    const common = {
      battles: availableBattles,
      pointsByBattleId,
      raidedToday,
      passesFilter,
    }
    const activeCampaignEventId =
      liveProgressResult?.value?.activeCampaignEventId
    return {
      overall: selectTopEventLocations(common),
      eventCampaign: activeCampaignEventId
        ? selectTopEventLocations({
            ...common,
            campaignGroupId: activeCampaignEventId,
          })
        : null,
    }
  }, [
    availableBattles,
    pointsByBattleId,
    raidedToday,
    filterBattlesById,
    filters,
    liveProgressResult,
  ])

  if (
    !battles ||
    !campaignDefinitions ||
    !npcsById ||
    !liveProgressResult ||
    !campaignEventProgressReady ||
    !campaignProgressResult
  ) {
    return { status: "loading" }
  }
  return { status: "ready", ...lists, locationsByBattleId, resourceByBattleId }
}

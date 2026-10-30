import { useMemo } from "react"
import type { BattleId } from "@workspace/game-domain"

import { mapCampaignBattleStorageToDomain } from "@/features/rank-lookup/@x/daily-raids"
import { useCampaignDisplay } from "@/shared/lib"
import { toById, useCatalogDataset } from "@/shared/local-data"

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
import {
  battleEventPoints,
  eventCampaignGroupIds,
  type HseRaidRule,
} from "./home-screen-event-rules"
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
  rule: HseRaidRule
): HomeScreenEventLocationsState {
  const {
    campaignName: campaignDisplayName,
    difficultyLabel: campaignDifficultyLabel,
    shortLabel: campaignShortLabel,
  } = useCampaignDisplay()
  // The state has no error variant: a failed read keeps the lists loading.
  const battlesRead = useCatalogDataset("campaign-battles")
  const campaignDefinitionsRead = useCatalogDataset("campaign-definitions")
  const npcsRead = useCatalogDataset("npcs", toById)
  const battles = battlesRead.status === "ready" ? battlesRead.data : undefined
  const campaignDefinitions =
    campaignDefinitionsRead.status === "ready"
      ? campaignDefinitionsRead.data
      : undefined
  const npcsById = npcsRead.status === "ready" ? npcsRead.data : undefined
  const {
    availableBattles,
    liveProgress,
    ready: eligibilityReady,
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
          battle.id,
          mapCampaignBattleStorageToDomain(battle),
        ])
      ),
    [battles]
  )
  const locationsByBattleId = useMemo(
    () =>
      buildLocationsByBattleId(allBattlesById, {
        campaignName: campaignDisplayName,
        difficultyLabel: campaignDifficultyLabel,
        shortLabel: campaignShortLabel,
      }),
    [
      allBattlesById,
      campaignDisplayName,
      campaignDifficultyLabel,
      campaignShortLabel,
    ]
  )
  const pointsByBattleId = useMemo(() => {
    const eventGroupIds = eventCampaignGroupIds(campaignDefinitions ?? [])
    return new Map(
      availableBattles.map((battle) => [
        battle.id,
        battleEventPoints(rule, battle, npcsById ?? new Map(), eventGroupIds),
      ])
    )
  }, [availableBattles, campaignDefinitions, rule, npcsById])
  const raidedToday = useMemo(() => {
    const attempts = liveProgress?.battleAttempts ?? []
    const index = buildBattleAttemptIndex(allBattlesById)
    const exhausted = buildAttemptsLeftByBattle(attempts, index)
    return new Set<string>([
      ...buildTodaysAttempts(attempts, index).map(
        (attempt) => attempt.battleId
      ),
      ...[...exhausted].filter(([, left]) => left === 0).map(([id]) => id),
    ])
  }, [liveProgress, allBattlesById])

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
    const activeCampaignEventId = liveProgress?.activeCampaignEventId
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
    liveProgress,
  ])

  if (!battles || !campaignDefinitions || !npcsById || !eligibilityReady) {
    return { status: "loading" }
  }
  return { status: "ready", ...lists, locationsByBattleId, resourceByBattleId }
}

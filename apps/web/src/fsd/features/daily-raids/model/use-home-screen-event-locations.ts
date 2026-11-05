import { useMemo } from "react"
import type { UpgradeStorageModel } from "@workspace/game-catalog"
import type { BattleId } from "@workspace/game-domain"

import { shardResourceId } from "@/features/goal-farming/@x/daily-raids"
import {
  mapCampaignBattleStorageToDomain,
  mapUpgradeStorageToDomain,
} from "@/features/rank-lookup/@x/daily-raids"
import { useCampaignDisplay } from "@/shared/lib"
import { toById, useCatalogDataset, usePlayerChunk } from "@/shared/local-data"

import { buildLocationsByBattleId } from "./daily-raid-locations"
import {
  buildAttemptsLeftByBattle,
  buildBattleAttemptIndex,
} from "./daily-raids-energy"
import type {
  DailyRaidBattleResource,
  DailyRaidLocationViewModel,
} from "./daily-raids.domain"
import type { EventFarmOrder } from "./home-screen-event-farm"
import {
  buildLocationDrops,
  selectEventLocations,
  type EventLocation,
} from "./home-screen-event-locations"
import {
  battleEventPoints,
  eventCampaignGroupIds,
  type HseRaidRule,
} from "./home-screen-event-rules"
import { buildRaidsFilterBattles } from "./raids-filters/campaign-type"
import { passLocationFilter } from "./raids-filters/pass-location-filter"
import { useRaidsFilters } from "./raids-filters/use-raids-filters"
import type { TodayQuickFilterOptions } from "./today-quick-filters/today-quick-filters"
import { useResourceByBattleId } from "./use-resource-by-battle-id"
import { useEligibleCampaignBattles } from "./use-eligible-campaign-battles"

export type HomeScreenEventLocationsState =
  | { status: "loading" }
  | {
      status: "ready"
      /** Every point-earning location over the eligible battles, most points per energy first. */
      locations: EventLocation[]
      /** What the player holds of each location's shown drop (`resourceByBattleId`). */
      ownedByBattleId: ReadonlyMap<BattleId, number>
      locationsByBattleId: ReadonlyMap<BattleId, DailyRaidLocationViewModel>
      resourceByBattleId: ReadonlyMap<BattleId, DailyRaidBattleResource>
    }

/**
 * The Dailies > HSE list with "Ignore goals" on (`selectEventLocations`): every point-earning
 * location, goals ignored and energy unlimited. It honors the persisted Raids Filters (evaluated
 * without a material) and "Raidable only" (battles to play manually left out), skips locked
 * locations (the shared eligibility, which only admits event-campaign nodes while their campaign is
 * the active campaign event) and locations with no attempts left today, and reads the inventory for
 * each location's drop. `order: "energy"` ranks by drop efficiency (`buildLocationDrops`: energy per
 * item against the cheapest location for the same item among the eligible, passing locations).
 */
export function useHomeScreenEventLocations(
  rule: HseRaidRule,
  {
    quickFilters,
    order = "points",
  }: { quickFilters?: TodayQuickFilterOptions; order?: EventFarmOrder } = {}
): HomeScreenEventLocationsState {
  const raidableOnly = quickFilters?.raidableOnly ?? false
  const fewerRaids = quickFilters?.fewerRaids ?? false
  const {
    campaignName: campaignDisplayName,
    difficultyLabel: campaignDifficultyLabel,
    shortLabel: campaignShortLabel,
  } = useCampaignDisplay()
  // The state has no error variant: a failed read keeps the lists loading.
  const battlesRead = useCatalogDataset("campaign-battles")
  const campaignDefinitionsRead = useCatalogDataset("campaign-definitions")
  const npcsRead = useCatalogDataset("npcs", toById)
  const upgradesRead = useCatalogDataset("upgrades", toDomainUpgrades)
  const charactersRead = useCatalogDataset("characters")
  const upgrades =
    upgradesRead.status === "ready" ? upgradesRead.data : undefined
  const characters =
    charactersRead.status === "ready" ? charactersRead.data : undefined
  const battles = battlesRead.status === "ready" ? battlesRead.data : undefined
  const campaignDefinitions =
    campaignDefinitionsRead.status === "ready"
      ? campaignDefinitionsRead.data
      : undefined
  const npcsById = npcsRead.status === "ready" ? npcsRead.data : undefined
  const {
    availableBattles,
    manualBattleIds,
    liveProgress,
    ready: eligibilityReady,
  } = useEligibleCampaignBattles(battles, campaignDefinitions)
  const inventoryUpgradesRead = usePlayerChunk("inventory-upgrades")
  const inventoryShardsRead = usePlayerChunk("inventory-shards")
  const inventoryUpgrades =
    inventoryUpgradesRead.status === "ready"
      ? inventoryUpgradesRead.data
      : undefined
  const inventoryShards =
    inventoryShardsRead.status === "ready"
      ? inventoryShardsRead.data
      : undefined
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
  const attemptsLeftByBattle = useMemo(
    () =>
      buildAttemptsLeftByBattle(
        liveProgress?.battleAttempts ?? [],
        buildBattleAttemptIndex(allBattlesById)
      ),
    [liveProgress, allBattlesById]
  )

  const passesFilter = useMemo(
    () => (battleId: string) => {
      if (raidableOnly && manualBattleIds.has(battleId)) return false
      const battle = filterBattlesById.get(battleId)
      return !battle || passLocationFilter(battle, filters)
    },
    [raidableOnly, manualBattleIds, filterBattlesById, filters]
  )
  // Only built for the energy order: it walks every material's farm locations.
  const dropByBattleId = useMemo(() => {
    if (order !== "energy") return undefined
    const passing = new Map(
      availableBattles
        .filter((battle) => passesFilter(battle.id))
        .flatMap((battle) => {
          const domain = allBattlesById.get(battle.id)
          return domain ? [[battle.id, domain] as const] : []
        })
    )
    return buildLocationDrops(
      [
        ...(upgrades ?? []),
        ...(characters ?? []).map((character) => ({
          id: shardResourceId(character.id),
          farmLocations: character.shardLocations.filter(
            (location) => !location.isMythic
          ),
        })),
      ],
      passing
    )
  }, [
    order,
    availableBattles,
    passesFilter,
    allBattlesById,
    upgrades,
    characters,
  ])

  const locations = useMemo(() => {
    return selectEventLocations({
      battles: availableBattles.map((battle) => ({
        id: battle.id,
        energyCost: battle.energyCost,
        dailyAttempts: battle.dailyAttempts,
      })),
      pointsByBattleId,
      attemptsLeftByBattle,
      passesFilter,
      dropByBattleId,
      order,
      fewerRaids,
    })
  }, [
    availableBattles,
    pointsByBattleId,
    attemptsLeftByBattle,
    passesFilter,
    dropByBattleId,
    order,
    fewerRaids,
  ])

  const ownedByBattleId = useMemo(() => {
    const upgrades = new Map(
      (inventoryUpgrades ?? []).map((entry) => [entry.upgradeId, entry.amount])
    )
    const shards = new Map(
      (inventoryShards ?? []).map((entry) => [entry.unitId, entry.amount])
    )
    const owned = new Map<BattleId, number>()
    for (const location of locations) {
      const visual = resourceByBattleId.get(location.battleId)?.visual
      if (!visual) continue
      owned.set(
        location.battleId,
        visual.kind === "upgrade"
          ? (upgrades.get(visual.id) ?? 0)
          : (shards.get(visual.unitId) ?? 0)
      )
    }
    return owned
  }, [locations, resourceByBattleId, inventoryUpgrades, inventoryShards])

  if (
    !battles ||
    !campaignDefinitions ||
    !npcsById ||
    !eligibilityReady ||
    (order === "energy" && (!upgrades || !characters))
  ) {
    return { status: "loading" }
  }
  return {
    status: "ready",
    locations,
    ownedByBattleId,
    locationsByBattleId,
    resourceByBattleId,
  }
}

const toDomainUpgrades = (records: UpgradeStorageModel[]) =>
  records.map(mapUpgradeStorageToDomain)

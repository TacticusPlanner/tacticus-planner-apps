import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useQuery } from "@tanstack/react-query"
import { useIsAuthenticated } from "@azure/msal-react"
import { rankAt, unitIdSchema, type UnitId } from "@workspace/game-domain"
import type { UpgradeStorageModel } from "@workspace/game-catalog"

import type { GoalDetail } from "@/entities/goal"
import { onslaughtProgressQueries } from "@/entities/player-data-override"
import { usePlanningSettings } from "@/entities/planning-setting"
import {
  mapCampaignBattleStorageToDomain,
  mapCharacterStorageToDomain,
  mapUpgradeStorageToDomain,
} from "@/features/rank-lookup/@x/daily-raids"
import { useCampaignDisplay, type ReadState } from "@/shared/lib"
import { toById, useCatalogDataset, usePlayerChunk } from "@/shared/local-data"

import { buildResourceByBattle } from "./daily-raid-battle-resources"
import type { HseRaidRule } from "./home-screen-event-rules"
import { useBattleMaps } from "./use-battle-maps"
import { useEligibleCampaignBattles } from "./use-eligible-campaign-battles"
import { activeProjectMembers, calculateDailyRaids } from "./daily-raids-calc"
import {
  buildAttemptsLeftByBattle,
  buildBattleAttemptIndex,
  buildTodaysAttempts,
  calculateRealEnergyUsedToday,
} from "./daily-raids-energy"
import { buildRaidsFilterBattles } from "./raids-filters/campaign-type"
import { useRaidsFilters } from "./raids-filters/use-raids-filters"
import { useScopedGoalPlan } from "./use-scoped-goal-plan"
import { buildLocationsByBattleId } from "./daily-raid-locations"
import type {
  DailyRaidResourceLabels,
  DailyRaidsCalculationViewModel,
  DailyRaidsViewModel,
} from "./daily-raids.domain"
import type { MissionRaidPlan, MissionRaidsRequest } from "./mission-raids"
import { planHookMissionRaids } from "./plan-hook-mission-raids"

/**
 * Today, Bonus Raids and Raids Plan: one run over every Active goal in global order
 * (`useGlobalGoalPlan`), sharing inventory, energy and attempt caps once. `projectId` optionally
 * narrows the run to that project's goals (still in global order); without it the run covers the
 * whole account.
 *
 * `options.homeScreenEventRule` (the Dailies > HSE tab, and the HRE tab while an HSE runs)
 * additionally returns `eventFarm`: the schedule-wide, energy-capped list of point-earning locations
 * that feed the goals (see `planEventFarm`), unless `options.eventFarm` is false, and with
 * `missionRaids` ranks the HRE suggestions by its points among equal energy costs. It changes
 * nothing else in the result; Today, Bonus Raids, Home and the Plan never pass it.
 *
 * `options.missionRaids` (the Dailies > HRE tab only) additionally returns `missionRaids`: where to
 * raid to finish the current HRE mission's campaign objective with the least energy, after Today's
 * remaining plan (see `planMissionRaids`). It is returned with or without goals.
 */
export function useDailyRaids(
  projectId?: string,
  options?: {
    homeScreenEventRule?: HseRaidRule
    eventFarm?: boolean
    missionRaids?: MissionRaidsRequest
  }
): DailyRaidsViewModel {
  const homeScreenEventRule = options?.homeScreenEventRule
  const missionRequest = options?.missionRaids
  const { t } = useTranslation(["dailies", "characters", "upgrades"])
  const {
    name: campaignDisplayName,
    tierLabel: campaignTierLabel,
    shortLabel: campaignShortLabel,
  } = useCampaignDisplay()
  const isAuthenticated = useIsAuthenticated()
  const globalPlan = useScopedGoalPlan(projectId)

  const charactersRead = useCatalogDataset("characters", toById)
  const mowsRead = useCatalogDataset("mows", toById)
  const upgradesRead = useCatalogDataset("upgrades", toUpgradesById)
  const battlesRead = useCatalogDataset("campaign-battles")
  const campaignDefinitionsRead = useCatalogDataset("campaign-definitions")
  const ascensionCostsRead = useCatalogDataset("ascension-costs", toById)
  const unlockShardCostsRead = useCatalogDataset("unlock-shard-costs", toById)
  const onslaughtRewardsRead = useCatalogDataset("onslaught-rewards")
  const shopsRead = useCatalogDataset("shops")
  // Resolved once (not per render): the Raids Filters' enemy traits and the event points read it.
  const npcsRead = useCatalogDataset("npcs", toById)
  const inventoryUpgradesRead = usePlayerChunk("inventory-upgrades")
  // Whole chunks by unit id: a goal's unit is looked up in them, so a goal change reads nothing.
  const playerCharactersRead = usePlayerChunk("characters", toByUnitId)
  const playerMowsRead = usePlayerChunk("mows", toByUnitId)
  const inventoryShardsRead = usePlayerChunk("inventory-shards", toByUnitId)
  const charactersById = dataOf(charactersRead)
  const mowsById = dataOf(mowsRead)
  const upgradesById = dataOf(upgradesRead)
  const battles = dataOf(battlesRead)
  const campaignDefinitions = dataOf(campaignDefinitionsRead)
  const {
    availableBattles,
    liveProgress,
    ready: eligibilityReady,
    isError: eligibilityError,
  } = useEligibleCampaignBattles(battles, campaignDefinitions)
  const ascensionCostsById = dataOf(ascensionCostsRead)
  const unlockShardCostsById = dataOf(unlockShardCostsRead)
  const onslaughtRewards = dataOf(onslaughtRewardsRead)
  const shops = dataOf(shopsRead)
  const npcsById = dataOf(npcsRead)
  const onslaughtProgressQuery = useQuery({
    ...onslaughtProgressQueries.current(),
    enabled: isAuthenticated,
  })
  const inventoryUpgrades = dataOf(inventoryUpgradesRead)
  const playerCharacterById = dataOf(playerCharactersRead)
  const playerMowById = dataOf(playerMowsRead)
  const inventoryShardById = dataOf(inventoryShardsRead)
  const localReadFailed = [
    charactersRead,
    mowsRead,
    upgradesRead,
    battlesRead,
    campaignDefinitionsRead,
    ascensionCostsRead,
    unlockShardCostsRead,
    onslaughtRewardsRead,
    shopsRead,
    npcsRead,
    inventoryUpgradesRead,
    playerCharactersRead,
    playerMowsRead,
    inventoryShardsRead,
  ].some((read) => read.status === "error")
  const { settings, loading: settingsLoading } = usePlanningSettings()
  const [raidsFilters] = useRaidsFilters()
  // Every catalog battle (not only the eligible ones) as the Raids Filters matcher reads it.
  const filterBattlesById = useMemo(
    () =>
      buildRaidsFilterBattles(
        battles ?? [],
        campaignDefinitions ?? [],
        npcsById
      ),
    [battles, campaignDefinitions, npcsById]
  )

  const { eventPointsByBattleId, enemyStatsByBattleId } = useBattleMaps({
    homeScreenEventRule,
    enemyStats: !!missionRequest?.manual,
    battles,
    campaignDefinitions,
    npcsById,
  })

  // Full catalog, unfiltered by eligibility — the source for real-attempt/energy/location-label
  // lookups (buildBattleAttemptIndex and friends below), which must reflect a real synced attempt
  // even at a battle the eligibility filter currently excludes (campaign-progress/campaign-events-
  // progress are independent signals from live-progress.battleAttempts and can momentarily disagree).
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
  // Eligibility-restricted — only this map feeds the scheduling/estimate engine (calculateDailyRaids).
  const battlesById = useMemo(
    () =>
      new Map(
        availableBattles.map((battle) => [
          battle.id,
          mapCampaignBattleStorageToDomain(battle),
        ])
      ),
    [availableBattles]
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
  // Game-data display names resolve through the id-keyed `upgrades`/`characters` namespaces — the
  // same convention Character Lookup uses — so one material can't read as two different names in two
  // places, with the catalog's own label as the fallback. Handed to both the plan path and the
  // catalog index below; giving it to only one would split the very names they share.
  const labelResource = useMemo<DailyRaidResourceLabels>(
    () => ({
      upgrade: (id, catalogLabel) =>
        t(`upgrades:${id}`, { defaultValue: catalogLabel }),
      shards: (unitId, characterName) =>
        t("dailies:resource.shards", {
          unit: t(`characters:${unitId}`, { defaultValue: characterName }),
        }),
    }),
    [t]
  )
  // Account-wide node → drop index for Today's Attempts, which lists nodes this project's plan
  // never mentions (tacticus-planner-apps#121). `charactersById` is keyed by unit id, so its values
  // already carry the `id` the shard icon needs.
  const resourceByBattleId = useMemo(
    () =>
      buildResourceByBattle(
        upgradesById?.values() ?? [],
        charactersById?.values() ?? [],
        labelResource
      ),
    [upgradesById, charactersById, labelResource]
  )
  const battleAttemptIndex = useMemo(
    () => buildBattleAttemptIndex(allBattlesById),
    [allBattlesById]
  )
  const realEnergyUsedToday = useMemo(
    () =>
      calculateRealEnergyUsedToday(
        liveProgress?.battleAttempts ?? [],
        battleAttemptIndex,
        allBattlesById
      ),
    [liveProgress, battleAttemptIndex, allBattlesById]
  )
  const attemptsLeftByBattle = useMemo(
    () =>
      buildAttemptsLeftByBattle(
        liveProgress?.battleAttempts ?? [],
        battleAttemptIndex
      ),
    [liveProgress, battleAttemptIndex]
  )
  const todaysAttempts = useMemo(
    () =>
      buildTodaysAttempts(
        liveProgress?.battleAttempts ?? [],
        battleAttemptIndex
      ),
    [liveProgress, battleAttemptIndex]
  )

  const failed =
    globalPlan.isError ||
    onslaughtProgressQuery.isError ||
    eligibilityError ||
    localReadFailed
  const planLoading = globalPlan.loading
  const goalEntries = globalPlan.entries
  const onslaughtReady = onslaughtProgressQuery.isSuccess
  const onslaughtProgress = onslaughtProgressQuery.data
  const dailyEnergy = settings.dailyEnergy
  const eventFarmOff = options?.eventFarm === false
  // The engine runs once per change of its inputs, never on a mere re-render (a keystroke in the
  // page above). It sits above the early returns, so every state calls the same Hooks.
  const computed = useMemo((): DailyRaidsViewModel | null => {
    const ready =
      !failed &&
      !planLoading &&
      charactersById &&
      mowsById &&
      upgradesById &&
      battles &&
      campaignDefinitions &&
      eligibilityReady &&
      ascensionCostsById &&
      unlockShardCostsById &&
      // `[]` is a catalog still syncing (or evicted), not a loaded dataset — rendering with it would
      // plan without Onslaught and, before this gate, threw on the first reward lookup.
      onslaughtRewards &&
      onslaughtRewards.length > 0 &&
      shops &&
      npcsById &&
      onslaughtReady &&
      inventoryUpgrades &&
      playerCharacterById &&
      playerMowById &&
      inventoryShardById &&
      !settingsLoading
    if (!ready) return null
    const planMission = (
      calculation: DailyRaidsCalculationViewModel | null
    ): MissionRaidPlan | undefined =>
      missionRequest
        ? planHookMissionRaids({
            request: missionRequest,
            calculation,
            availableBattles,
            campaignDefinitions,
            attemptsLeftByBattle,
            dailyEnergy,
            realEnergyUsedToday,
            filterBattlesById,
            raidsFilters,
            eventPointsByBattleId,
            enemyStatsByBattleId,
          })
        : undefined
    const details = activeProjectMembers(goalEntries).map(
      // The goals list carries every goal in full, so no goal's detail is read separately.
      (member) => member.goal
    )
    if (details.length === 0) {
      return {
        status: "no-goals",
        missionRaids: planMission(null),
        locationsByBattleId,
      }
    }

    const farm = eventFarmOff ? undefined : eventPointsByBattleId
    const result = calculateDailyRaids({
      members: goalEntries,
      details,
      playerCharacterById,
      playerMowById,
      inventoryShardById,
      inventoryUpgrades,
      upgradesById,
      battlesById,
      charactersById,
      mowsById,
      ascensionCostsById,
      unlockShardCostsById,
      onslaughtProgress,
      onslaughtRewards,
      shops,
      getCharacter: (id) => {
        const record = charactersById.get(id)
        return record ? mapCharacterStorageToDomain(record) : undefined
      },
      labelResource,
      getUnitLabel: (detail) => {
        if (detail.entityType === "Character") {
          return t(`characters:${detail.entityId}`, {
            defaultValue:
              charactersById.get(detail.entityId as UnitId)?.name ??
              detail.entityId,
          })
        }
        return mowsById.get(detail.entityId)?.name ?? detail.entityId
      },
      getTargetLabel: (detail) => {
        if (detail.goalType === "Rank" && detail.config.rank) {
          return t("dailies:target.rank", {
            value: rankAt(detail.config.rank.end),
          })
        }
        if (detail.goalType === "Ability" && detail.config.ability) {
          return t("dailies:target.ability", {
            value: Math.max(
              detail.config.ability.activeEnd,
              detail.config.ability.passiveEnd
            ),
          })
        }
        if (detail.goalType === "Ascension" && detail.config.progression) {
          return t("dailies:target.ascension", {
            value: detail.config.progression.end,
          })
        }
        if (detail.goalType === "Unlock") return t("dailies:target.unlock")
        if (detail.goalType === "Upgrade" && detail.config.upgrade) {
          return t("dailies:target.upgrade", {
            value: detail.config.upgrade.targets.reduce(
              (total, target) => total + target.quantity,
              0
            ),
          })
        }
        return t("dailies:target.other", { value: detail.goalType })
      },
      dailyEnergy,
      raidsFilters,
      filterBattlesById,
      eventFarm: farm
        ? {
            pointsByBattleId: farm,
            attemptsLeftByBattle,
            energyBudget: Math.max(0, dailyEnergy - realEnergyUsedToday),
          }
        : undefined,
      missionGoalNodes: !!missionRequest,
    })
    return result
      ? {
          ...result,
          missionRaids: planMission(result),
          locationsByBattleId,
          resourceByBattleId,
          realEnergyUsedToday,
          attemptsLeftByBattle,
          todaysAttempts,
        }
      : {
          status: "no-farmable",
          missionRaids: planMission(null),
          locationsByBattleId,
        }
  }, [
    ascensionCostsById,
    attemptsLeftByBattle,
    availableBattles,
    battles,
    battlesById,
    campaignDefinitions,
    charactersById,
    dailyEnergy,
    eligibilityReady,
    enemyStatsByBattleId,
    eventFarmOff,
    eventPointsByBattleId,
    failed,
    filterBattlesById,
    goalEntries,
    inventoryShardById,
    inventoryUpgrades,
    labelResource,
    locationsByBattleId,
    missionRequest,
    mowsById,
    npcsById,
    onslaughtProgress,
    onslaughtReady,
    onslaughtRewards,
    planLoading,
    playerCharacterById,
    playerMowById,
    raidsFilters,
    realEnergyUsedToday,
    resourceByBattleId,
    settingsLoading,
    shops,
    t,
    todaysAttempts,
    unlockShardCostsById,
    upgradesById,
  ])
  if (failed) return ERROR_STATE
  return computed ?? LOADING_STATE
}

const ERROR_STATE: DailyRaidsViewModel = { status: "error" }
const LOADING_STATE: DailyRaidsViewModel = { status: "loading" }

function dataOf<T>(read: ReadState<T>): T | undefined {
  return read.status === "ready" ? read.data : undefined
}

const toUpgradesById = (records: UpgradeStorageModel[]) =>
  new Map(records.map((item) => [item.id, mapUpgradeStorageToDomain(item)]))

function toByUnitId<T extends { unitId: string }>(
  chunk: readonly T[] | null
): ReadonlyMap<string, T> {
  return new Map((chunk ?? []).map((record) => [record.unitId, record]))
}

export function playerUnitIds(
  details: readonly Pick<GoalDetail, "entityId" | "entityType">[]
) {
  const characterIds = new Set<UnitId>()
  const mowIds = new Set<UnitId>()
  for (const detail of details) {
    const parsed = unitIdSchema.safeParse(detail.entityId)
    if (!parsed.success) continue
    if (detail.entityType === "Character") characterIds.add(parsed.data)
    if (detail.entityType === "Mow") mowIds.add(parsed.data)
  }
  return {
    characterIds: [...characterIds],
    mowIds: [...mowIds],
  }
}

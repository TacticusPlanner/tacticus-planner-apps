import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useQueries, useQuery } from "@tanstack/react-query"
import { useIsAuthenticated } from "@azure/msal-react"
import { useLiveQuery } from "dexie-react-hooks"
import { campaignDescriptor, campaignIcon } from "@workspace/game-catalog"
import {
  rankAt,
  unitIdSchema,
  type BattleId,
  type UnitId,
} from "@workspace/game-domain"
import {
  getAscensionCostsMap,
  getCampaignBattles,
  getCampaignDefinitions,
  getCharactersMap,
  getMowsMap,
  getOnslaughtRewards,
  getShops,
  getUnlockShardCostsMap,
  getUpgrades,
} from "@workspace/game-catalog/queries"
import {
  getCampaignEventProgress,
  getInventoryShard,
  getInventoryUpgrades,
  getLiveProgress,
  getPlayerCharacter,
  getPlayerMow,
} from "@workspace/player-data/queries"

import { goalQueries, type GoalDetail } from "@/entities/goal"
import { onslaughtProgressQueries } from "@/entities/player-data-override"
import { projectQueries } from "@/entities/project"
import { usePlanningSettings } from "@/entities/planning-setting"
import {
  mapCampaignBattleStorageToDomain,
  mapCharacterStorageToDomain,
  mapUpgradeStorageToDomain,
} from "@/features/rank-lookup/@x/daily-raids"
import { useCampaignDisplay } from "@/shared/lib"

import { buildResourceByBattle } from "./daily-raid-battle-resources"
import {
  availableCampaignBattles,
  campaignEventProgressKey,
} from "./campaign-event-eligibility"
import { activeProjectMembers, calculateDailyRaids } from "./daily-raids-calc"
import {
  buildAttemptsLeftByBattle,
  buildBattleAttemptIndex,
  buildTodaysAttempts,
  calculateRealEnergyUsedToday,
} from "./daily-raids-energy"
import { campaignLocationLabels } from "./daily-raids.domain"
import type {
  DailyRaidResourceLabels,
  DailyRaidsViewModel,
} from "./daily-raids.domain"

export function useDailyRaids(
  projectId: string | undefined
): DailyRaidsViewModel {
  const { t } = useTranslation(["dailies", "characters", "upgrades"])
  const {
    name: campaignDisplayName,
    tierLabel: campaignTierLabel,
    shortLabel: campaignShortLabel,
  } = useCampaignDisplay()
  const isAuthenticated = useIsAuthenticated()
  const membersQuery = useQuery({
    ...projectQueries.goals(projectId ?? "unselected"),
    enabled: Boolean(isAuthenticated && projectId),
  })
  const activeMembers = activeProjectMembers(membersQuery.data?.goals ?? [])
  const detailQueries = useQueries({
    queries: activeMembers.map((member) =>
      goalQueries.detail(member.goal.goalId)
    ),
  })
  const details = detailQueries.flatMap((query) =>
    query.data ? [query.data] : []
  )
  const detailKey = details
    .map((detail) => `${detail.goalId}:${detail.entityType}:${detail.entityId}`)
    .join(",")

  const charactersById = useLiveQuery(() => getCharactersMap(), [])
  const mowsById = useLiveQuery(() => getMowsMap(), [])
  const upgrades = useLiveQuery(() => getUpgrades(), [])
  const battles = useLiveQuery(() => getCampaignBattles(), [])
  const campaignDefinitions = useLiveQuery(() => getCampaignDefinitions(), [])
  const liveProgressResult = useLiveQuery(
    async () => ({ value: await getLiveProgress() }),
    []
  )
  const campaignEventProgressResult = useLiveQuery(
    async () => ({ value: await getCampaignEventProgress() }),
    []
  )
  const ascensionCostsById = useLiveQuery(() => getAscensionCostsMap(), [])
  const unlockShardCostsById = useLiveQuery(() => getUnlockShardCostsMap(), [])
  const onslaughtRewards = useLiveQuery(() => getOnslaughtRewards(), [])
  const shops = useLiveQuery(() => getShops(), [])
  const onslaughtProgressQuery = useQuery({
    ...onslaughtProgressQueries.current(),
    enabled: isAuthenticated,
  })
  const inventoryUpgrades = useLiveQuery(() => getInventoryUpgrades(), [])
  const playerState = useLiveQuery(async () => {
    const { characterIds, mowIds } = playerUnitIds(details)
    const [characters, mows, shards] = await Promise.all([
      Promise.all(
        characterIds.map(
          async (id) => [id, await getPlayerCharacter(id)] as const
        )
      ),
      Promise.all(
        mowIds.map(async (id) => [id, await getPlayerMow(id)] as const)
      ),
      Promise.all(
        characterIds.map(
          async (id) => [id, await getInventoryShard(id)] as const
        )
      ),
    ])
    return {
      playerCharacterById: new Map(characters),
      playerMowById: new Map(mows),
      inventoryShardById: new Map(shards),
    }
  }, [detailKey])
  const { settings, loading: settingsLoading } = usePlanningSettings()

  const upgradesById = useMemo(
    () =>
      new Map(
        (upgrades ?? []).map((item) => [
          item.id,
          mapUpgradeStorageToDomain(item),
        ])
      ),
    [upgrades]
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
      new Map(
        (campaignEventProgressResult?.value ?? []).map((progress) => [
          campaignEventProgressKey(progress.tacticusCampaignId, progress.type),
          {
            completedBattleCount: progress.completedBattleCount,
            completedChallengeBattlesIds: progress.completedChallengeBattlesIds,
          },
        ])
      ),
    [campaignEventProgressResult]
  )
  const battlesById = useMemo(() => {
    const availableBattles = availableCampaignBattles(
      battles ?? [],
      eventCampaignIds,
      liveProgressResult?.value?.activeCampaignEventId,
      campaignEventProgressByKey
    )
    return new Map(
      availableBattles.map((battle) => [
        battle.id as BattleId,
        mapCampaignBattleStorageToDomain(battle),
      ])
    )
  }, [
    battles,
    eventCampaignIds,
    liveProgressResult,
    campaignEventProgressByKey,
  ])
  const locationsByBattleId = useMemo(
    () =>
      new Map(
        [...battlesById].map(([battleId, battle]) => {
          const descriptor = campaignDescriptor(
            battle.campaignGroupId,
            battle.type,
            battle.challenge
          )
          const short = descriptor ? campaignShortLabel(descriptor) : null
          return [
            battleId,
            {
              id: battleId,
              ...campaignLocationLabels(battleId, battle, descriptor, {
                name: campaignDisplayName,
                tierLabel: campaignTierLabel,
              }),
              shortLabel: short
                ? `${short.name} ${short.code} ${battle.nodeNumber}${short.challenge ? "B" : ""}`
                : battle.campaignGroupId,
              challenge: battle.challenge,
              icon: campaignIcon(
                battle.campaignGroupId,
                battle.type,
                battle.challenge
              ),
            },
          ] as const
        })
      ),
    [battlesById, campaignDisplayName, campaignTierLabel, campaignShortLabel]
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
        upgradesById.values(),
        charactersById?.values() ?? [],
        labelResource
      ),
    [upgradesById, charactersById, labelResource]
  )
  const battleAttemptIndex = useMemo(
    () => buildBattleAttemptIndex(battlesById),
    [battlesById]
  )
  const realEnergyUsedToday = useMemo(
    () =>
      calculateRealEnergyUsedToday(
        liveProgressResult?.value?.battleAttempts ?? [],
        battleAttemptIndex,
        battlesById
      ),
    [liveProgressResult, battleAttemptIndex, battlesById]
  )
  const attemptsLeftByBattle = useMemo(
    () =>
      buildAttemptsLeftByBattle(
        liveProgressResult?.value?.battleAttempts ?? [],
        battleAttemptIndex
      ),
    [liveProgressResult, battleAttemptIndex]
  )
  const todaysAttempts = useMemo(
    () =>
      buildTodaysAttempts(
        liveProgressResult?.value?.battleAttempts ?? [],
        battleAttemptIndex
      ),
    [liveProgressResult, battleAttemptIndex]
  )

  if (!projectId) return { status: "no-project" }
  if (
    membersQuery.isError ||
    detailQueries.some((query) => query.isError) ||
    onslaughtProgressQuery.isError
  ) {
    return { status: "error" }
  }
  const ready =
    membersQuery.isSuccess &&
    detailQueries.every((query) => query.isSuccess) &&
    charactersById &&
    mowsById &&
    upgrades &&
    battles &&
    campaignDefinitions &&
    liveProgressResult &&
    campaignEventProgressResult &&
    ascensionCostsById &&
    unlockShardCostsById &&
    onslaughtRewards &&
    shops &&
    onslaughtProgressQuery.isSuccess &&
    inventoryUpgrades &&
    playerState &&
    !settingsLoading
  if (!ready) return { status: "loading" }

  const result = calculateDailyRaids({
    members: membersQuery.data.goals,
    details,
    ...playerState,
    inventoryUpgrades,
    upgradesById,
    battlesById,
    charactersById,
    mowsById,
    ascensionCostsById,
    unlockShardCostsById,
    onslaughtProgress: onslaughtProgressQuery.data,
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
      if (detail.goalType === "Level" && detail.config.level) {
        return t("dailies:target.level", { value: detail.config.level.end })
      }
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
    dailyEnergy: settings.dailyEnergy,
  })
  return result
    ? {
        ...result,
        locationsByBattleId,
        resourceByBattleId,
        realEnergyUsedToday,
        attemptsLeftByBattle,
        todaysAttempts,
      }
    : { status: "no-farmable" }
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

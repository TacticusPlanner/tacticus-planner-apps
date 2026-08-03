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
  getUnlockShardCostsMap,
  getUpgrades,
} from "@workspace/game-catalog/queries"
import {
  getInventoryShard,
  getInventoryUpgrades,
  getLiveProgress,
  getPlayerCharacter,
  getPlayerMow,
} from "@workspace/player-data/queries"

import { goalQueries, type GoalDetail } from "@/entities/goal"
import { projectQueries } from "@/entities/project"
import { usePlanningSettings } from "@/entities/planning-setting"
import {
  mapCampaignBattleStorageToDomain,
  mapCharacterStorageToDomain,
  mapUpgradeStorageToDomain,
} from "@/features/rank-lookup"
import { useCampaignDisplay } from "@/shared/lib"

import {
  activeProjectMembers,
  availableCampaignBattles,
  calculateDailyRaids,
} from "./daily-raids-calc"
import type { DailyRaidsViewModel } from "./daily-raids.domain"

export function useDailyRaids(
  projectId: string | undefined
): DailyRaidsViewModel {
  const { t } = useTranslation(["dailies", "characters"])
  const { shortLabel: campaignShortLabel } = useCampaignDisplay()
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
  const ascensionCostsById = useLiveQuery(() => getAscensionCostsMap(), [])
  const unlockShardCostsById = useLiveQuery(() => getUnlockShardCostsMap(), [])
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
  const battlesById = useMemo(() => {
    const eventCampaignIds = new Set(
      (campaignDefinitions ?? [])
        .filter((definition) => definition.releaseType === "event")
        .map((definition) => definition.groupId)
    )
    const availableBattles = availableCampaignBattles(
      battles ?? [],
      eventCampaignIds,
      liveProgressResult?.value?.activeCampaignEventId
    )
    return new Map(
      availableBattles.map((battle) => [
        battle.id as BattleId,
        mapCampaignBattleStorageToDomain(battle),
      ])
    )
  }, [battles, campaignDefinitions, liveProgressResult])
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
              label: short
                ? `${short.name} ${short.code} ${battle.nodeNumber}${short.challenge ? "B" : ""}`
                : battle.campaignGroupId,
              icon: campaignIcon(
                battle.campaignGroupId,
                battle.type,
                battle.challenge
              ),
            },
          ] as const
        })
      ),
    [battlesById, campaignShortLabel]
  )

  if (!projectId) return { status: "no-project" }
  if (membersQuery.isError || detailQueries.some((query) => query.isError)) {
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
    ascensionCostsById &&
    unlockShardCostsById &&
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
    getCharacter: (id) => {
      const record = charactersById.get(id)
      return record ? mapCharacterStorageToDomain(record) : undefined
    },
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
  return result ? { ...result, locationsByBattleId } : { status: "no-farmable" }
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

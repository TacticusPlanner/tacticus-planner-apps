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

import { goalQueries } from "@/entities/goal"
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
  const detailKey = details.map((detail) => detail.goalId).join(",")

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
    const ids = [
      ...new Set(details.filter(isUnitGoal).map((detail) => detail.entityId)),
    ]
    const [characters, mows, shards] = await Promise.all([
      Promise.all(
        ids.map(
          async (id) => [id, await getPlayerCharacter(asUnitId(id))] as const
        )
      ),
      Promise.all(
        ids.map(async (id) => [id, await getPlayerMow(asUnitId(id))] as const)
      ),
      Promise.all(
        ids.map(
          async (id) => [id, await getInventoryShard(asUnitId(id))] as const
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
      return detail.goalType
    },
    dailyEnergy: settings.dailyEnergy,
  })
  return result ? { ...result, locationsByBattleId } : { status: "no-farmable" }
}

function isUnitGoal(detail: { entityType: string }) {
  return detail.entityType === "Character" || detail.entityType === "Mow"
}

function asUnitId(id: string): UnitId {
  return unitIdSchema.parse(id)
}

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { useIsAuthenticated } from "@azure/msal-react"
import { useLiveQuery } from "dexie-react-hooks"
import { getOnslaughtRewards } from "@workspace/game-catalog/queries"
import type {
  AscensionCostStorageModel,
  CharacterStorageModel,
  UnlockShardCostStorageModel,
} from "@workspace/game-catalog"
import type { Progression, UnitId } from "@workspace/game-domain"
import { getInventoryShard } from "@workspace/player-data/queries"
import type { PlayerDataChunkDto } from "@workspace/player-data"

import {
  onslaughtReward,
  onslaughtProgressQueries,
  progressForAlliance,
} from "@/entities/player-data-override"

import { estimateGoal } from "@/features/goal-farming"
import { mythicShardResourceId, shardResourceId } from "@/features/goal-farming"
import {
  ascensionResourceNeed,
  unlockResourceNeed,
} from "@/features/goal-farming"
import { estimateRemainingShardEnergy } from "@/features/goal-farming"
import {
  projectOnslaughtSupply,
  projectShopSupply,
} from "@/features/goal-farming"
import type { FlatSupplier } from "@/features/goal-farming"
import type { GoalAcquisitionPlan } from "./acquisition-plan"

type PlayerUnit =
  PlayerDataChunkDto<"characters">[number] | PlayerDataChunkDto<"mows">[number]

export function useProgressionPreview(params: {
  entityId?: UnitId
  entityType: "Character" | "Mow"
  character?: CharacterStorageModel
  playerEntity?: PlayerUnit
  progressionStart: Progression
  progressionEnd: Progression
  ascensionEnabled: boolean
  unlockEnabled: boolean
  /** The selected Campaigns/Onslaught/Shops sources (plan: acquisition-source picker,
   *  tacticus-planner-apps#103) — replaces the old single-select `source` and the separate
   *  regular/mythic farming-location-id params, all of which the plan now carries. */
  plan: GoalAcquisitionPlan
  ascensionCostsById?: ReadonlyMap<string, AscensionCostStorageModel>
  unlockShardCostsById?: ReadonlyMap<string, UnlockShardCostStorageModel>
  battlesById: Parameters<typeof estimateGoal>[0]["battlesById"]
  dailyEnergy: number
}) {
  const isAuthenticated = useIsAuthenticated()
  const inventoryShard = useLiveQuery(
    () => (params.entityId ? getInventoryShard(params.entityId) : undefined),
    [params.entityId]
  )
  const rewards = useLiveQuery(() => getOnslaughtRewards(), [])
  const { data: onslaughtProgress } = useQuery({
    ...onslaughtProgressQueries.current(),
    enabled: isAuthenticated,
  })

  return useMemo(() => {
    if (
      !params.entityId ||
      !params.ascensionCostsById ||
      !params.unlockShardCostsById
    )
      return null
    const ascension = params.ascensionEnabled
      ? ascensionResourceNeed({
          start: params.progressionStart,
          end: params.progressionEnd,
          entityId: params.entityId,
          isMow: params.entityType === "Mow",
          ownedShards: params.playerEntity?.shards ?? 0,
          ownedMythicShards: params.playerEntity?.mythicShards ?? 0,
          currentProgression: params.playerEntity?.progressionIndex,
          ascensionCostsById: params.ascensionCostsById,
        })
      : null
    const unlock = params.unlockEnabled
      ? unlockResourceNeed({
          initialRarity: params.character?.initialRarity,
          entityId: params.entityId,
          isMow: params.entityType === "Mow",
          ownedShards: inventoryShard?.amount ?? 0,
          unlockShardCostsById: params.unlockShardCostsById,
        })
      : null
    const regularShards = (ascension?.shards ?? 0) + (unlock?.shards ?? 0)
    const mythicShards = ascension?.mythicShards ?? 0
    const shardId = shardResourceId(params.entityId)
    const mythicShardId = mythicShardResourceId(params.entityId)

    // Campaign nodes only ever drop regular shards (mythic is Onslaught/Shop-only) — a mythic-only
    // location must never be counted as a source for the regular-shard need, and vice versa.
    const regularShardLocations =
      params.character?.shardLocations.filter(
        (location) => !location.isMythic
      ) ?? []
    const mythicShardLocations =
      params.character?.shardLocations.filter(
        (location) => location.isMythic
      ) ?? []

    // The Campaigns group unselected excludes campaign farming from the goal entirely (spec) — the
    // engine sees no farm locations for either shard type in that case, rather than an "unrestricted"
    // node set.
    const campaignRegularLocations = params.plan.campaign.enabled
      ? regularShardLocations
      : []
    const campaignMythicLocations = params.plan.campaign.enabled
      ? mythicShardLocations
      : []
    const campaignFarmingLocationIds = params.plan.campaign.enabled
      ? [
          ...params.plan.campaign.regularBattleIds,
          ...params.plan.campaign.mythicBattleIds,
        ]
      : []

    // Selected shop offers each become a flat (energy-free) per-day supplier — spec: acquisition
    // sources are simulated concurrently across farming days, not as a separate estimate combined
    // afterward.
    const referenceDate = new Date()
    const flatSuppliers: FlatSupplier[] = []
    if (params.plan.shops.enabled) {
      for (const offer of params.plan.shops.offers) {
        flatSuppliers.push(projectShopSupply(offer, referenceDate))
      }
    }

    // Onslaught grants character shards only (regular or mythic depending on the character's
    // rarity) — never ascension orbs (the onslaught-rewards dataset has no orb field), so this only
    // ever affects shard need, and the goal's orb requirement/estimate is untouched regardless.
    let onslaughtShardsPerRun = 0
    if (
      params.plan.onslaught.enabled &&
      params.ascensionEnabled &&
      onslaughtProgress &&
      rewards?.length
    ) {
      const progress = progressForAlliance(
        onslaughtProgress,
        params.character?.alliance ?? "Imperial"
      )
      const rarity = (
        params.playerEntity?.progressionIndex ?? params.progressionStart
      ).split(":")[0]
      const isMythicNeed = mythicShards > 0
      const reward = onslaughtReward(
        rewards,
        progress.sector,
        progress.tier,
        isMythicNeed ? "Mythic" : regularRewardKey(rarity)
      )
      onslaughtShardsPerRun = (reward.min + reward.max) / 2
      flatSuppliers.push(
        projectOnslaughtSupply({
          entityId: params.entityId,
          isMythic: isMythicNeed,
          avgShardsPerRun: onslaughtShardsPerRun,
        })
      )
    }

    const suppliedResourceIds = new Set(
      flatSuppliers.map((supplier) => supplier.resourceId)
    )
    const needs: {
      id: typeof shardId | typeof mythicShardId
      count: number
    }[] = []
    if (regularShards > 0) needs.push({ id: shardId, count: regularShards })
    // A mythic need only enters the combined day-loop when some source (campaign or a flat
    // supplier) can actually cover it — otherwise it stays silently count-only, as it always has.
    if (
      mythicShards > 0 &&
      (campaignMythicLocations.length > 0 ||
        suppliedResourceIds.has(mythicShardId))
    ) {
      needs.push({ id: mythicShardId, count: mythicShards })
    }

    const combined =
      needs.length > 0
        ? estimateGoal({
            needs,
            upgradesById: new Map([
              [
                shardId,
                { id: shardId, farmLocations: campaignRegularLocations },
              ],
              [
                mythicShardId,
                { id: mythicShardId, farmLocations: campaignMythicLocations },
              ],
            ]),
            battlesById: params.battlesById,
            dailyEnergy: params.dailyEnergy,
            farmingLocationIds: campaignFarmingLocationIds,
            flatSuppliers,
            referenceDate,
          })
        : null

    // Ascension's own "energy for remaining shards" lines (plan: shard-location selector) —
    // isolated to Ascension's net need alone (not combined with Unlock's, unlike `combined` above),
    // campaign-only (they predate flat suppliers and remain a supplementary "if farmed from
    // campaign alone" figure). Same "must select at least one location" gate as before.
    const ascensionShardEnergy =
      params.ascensionEnabled &&
      params.character &&
      params.plan.campaign.enabled &&
      params.plan.campaign.regularBattleIds.length > 0
        ? estimateRemainingShardEnergy({
            entityId: params.entityId,
            remainingShards: ascension?.shards ?? 0,
            shardLocations: regularShardLocations,
            battlesById: params.battlesById,
            farmingLocationIds: params.plan.campaign.regularBattleIds,
            dailyEnergy: params.dailyEnergy,
          })
        : null
    const ascensionMythicShardEnergy =
      params.ascensionEnabled &&
      params.character &&
      params.plan.campaign.enabled &&
      params.plan.campaign.mythicBattleIds.length > 0
        ? estimateRemainingShardEnergy({
            entityId: params.entityId,
            remainingShards: ascension?.mythicShards ?? 0,
            shardLocations: mythicShardLocations,
            battlesById: params.battlesById,
            farmingLocationIds: params.plan.campaign.mythicBattleIds,
            dailyEnergy: params.dailyEnergy,
          })
        : null

    return {
      regularShards,
      mythicShards,
      orbsByType: ascension?.orbsByType ?? {},
      combined,
      combinedDays: combined?.status === "Estimated" ? combined.days : 0,
      ascensionShardEnergy,
      ascensionMythicShardEnergy,
      // Whether the *Ascension goal itself* (not the combined Unlock+Ascension `regularShards`/
      // `mythicShards` above) needs each shard type — drives which of the two shard-location groups
      // the Ascension card offers (plan: don't recommend a mythic-only node like a Mythic-tier
      // Extremis node for a below-Mythic range, and vice versa).
      ascensionNeedsRegularShards: (ascension?.shards ?? 0) > 0,
      ascensionNeedsMythicShards: (ascension?.mythicShards ?? 0) > 0,
      onslaughtShardsPerRun,
      onslaughtProgressSaved: !!onslaughtProgress,
    }
  }, [params, inventoryShard?.amount, onslaughtProgress, rewards])
}

function regularRewardKey(rarity: string) {
  return (
    ["Common", "Uncommon", "Rare", "Epic", "Legendary"].includes(rarity)
      ? rarity
      : "Legendary"
  ) as "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary"
}

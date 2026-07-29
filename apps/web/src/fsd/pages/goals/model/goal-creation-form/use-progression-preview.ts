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
import {
  getInventoryShard,
  getLiveProgress,
} from "@workspace/player-data/queries"
import type { PlayerDataChunkDto } from "@workspace/player-data"

import {
  onslaughtReward,
  onslaughtProgressQueries,
  progressForAlliance,
} from "@/entities/player-data-override"
import type { AscensionFarmingSource } from "@/entities/goal"

import { estimateGoal } from "../estimate/estimate"
import { shardResourceId } from "../estimate/estimate.domain"
import {
  ascensionResourceNeed,
  unlockResourceNeed,
} from "../estimate/progression-cost-calc"
import { estimateRemainingShardEnergy } from "../estimate/shard-energy-estimate"

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
  source: AscensionFarmingSource
  ascensionCostsById?: ReadonlyMap<string, AscensionCostStorageModel>
  unlockShardCostsById?: ReadonlyMap<string, UnlockShardCostStorageModel>
  battlesById: Parameters<typeof estimateGoal>[0]["battlesById"]
  dailyEnergy: number
  /** The shard-location selector's checked battle ids, split by shard type (plan: Unlock/Ascension
   * shard-location picker, mythic-vs-regular filtering) — empty means unrestricted for that type
   * (auto-pick least-energy node(s) among all of that type, the pre-existing behavior), matching
   * `estimateGoal`'s own `farmingLocationIds` semantics. A regular selection never restricts the
   * mythic estimate or vice versa — they're independent picks. */
  regularFarmingLocationIds?: readonly string[]
  mythicFarmingLocationIds?: readonly string[]
}) {
  const isAuthenticated = useIsAuthenticated()
  const inventoryShard = useLiveQuery(
    () => (params.entityId ? getInventoryShard(params.entityId) : undefined),
    [params.entityId]
  )
  const liveProgress = useLiveQuery(() => getLiveProgress(), [])
  const rewards = useLiveQuery(() => getOnslaughtRewards(), [])
  const currentOnslaughtTokens =
    liveProgress?.gameModeTokens.onslaught?.current ?? 0
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
    const campaignEnabled =
      params.unlockEnabled || params.source !== "Onslaught"
    const shardId = shardResourceId(params.entityId)
    // Campaign nodes only ever drop regular shards (mythic is Onslaught-only below) — a mythic-only
    // location must never be counted as a source for this regular-shard need.
    const regularShardLocations =
      params.character?.shardLocations.filter(
        (location) => !location.isMythic
      ) ?? []
    const mythicShardLocations =
      params.character?.shardLocations.filter(
        (location) => location.isMythic
      ) ?? []
    const campaign =
      campaignEnabled && regularShards > 0 && params.character
        ? estimateGoal({
            needs: [{ id: shardId, count: regularShards }],
            upgradesById: new Map([
              [shardId, { id: shardId, farmLocations: regularShardLocations }],
            ]),
            battlesById: params.battlesById,
            dailyEnergy: params.dailyEnergy,
            farmingLocationIds: params.regularFarmingLocationIds,
          })
        : null
    let onslaughtTokens = 0
    if (
      params.ascensionEnabled &&
      params.source !== "Campaign" &&
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
      const regular = onslaughtReward(
        rewards,
        progress.sector,
        progress.tier,
        regularRewardKey(rarity)
      )
      const mythic = onslaughtReward(
        rewards,
        progress.sector,
        progress.tier,
        "Mythic"
      )
      onslaughtTokens =
        tokensFor(ascension?.shards ?? 0, regular) +
        tokensFor(mythicShards, mythic)
    }
    const onslaughtDays =
      Math.max(0, onslaughtTokens - currentOnslaughtTokens) / 1.5
    const campaignDays = campaign?.status === "Estimated" ? campaign.days : 0

    // Ascension's own "energy for remaining shards" lines (plan: shard-location selector) — isolated
    // to Ascension's net need alone (not combined with Unlock's, unlike `campaign` above, which nets
    // both together for the shared farm-day simulation when both are enabled), and split by shard
    // type since a single Ascension range can need regular shards, mythic shards, or both (a step
    // that crosses into the Mythic tier switches from one to the other), each only ever farmable from
    // its own matching-type locations.
    // Same "must select at least one location" gate as Unlock's own energy line — an empty selection
    // means "nothing picked yet", not `estimateRemainingShardEnergy`'s usual unrestricted/auto-pick
    // fallback.
    const ascensionShardEnergy =
      params.ascensionEnabled &&
      params.character &&
      (params.regularFarmingLocationIds?.length ?? 0) > 0
        ? estimateRemainingShardEnergy({
            entityId: params.entityId,
            remainingShards: ascension?.shards ?? 0,
            shardLocations: regularShardLocations,
            battlesById: params.battlesById,
            farmingLocationIds: params.regularFarmingLocationIds ?? [],
            dailyEnergy: params.dailyEnergy,
          })
        : null
    const ascensionMythicShardEnergy =
      params.ascensionEnabled &&
      params.character &&
      (params.mythicFarmingLocationIds?.length ?? 0) > 0
        ? estimateRemainingShardEnergy({
            entityId: params.entityId,
            remainingShards: ascension?.mythicShards ?? 0,
            shardLocations: mythicShardLocations,
            battlesById: params.battlesById,
            farmingLocationIds: params.mythicFarmingLocationIds ?? [],
            dailyEnergy: params.dailyEnergy,
          })
        : null

    return {
      regularShards,
      mythicShards,
      orbsByType: ascension?.orbsByType ?? {},
      campaign,
      ascensionShardEnergy,
      ascensionMythicShardEnergy,
      // Whether the *Ascension goal itself* (not the combined Unlock+Ascension `regularShards`/
      // `mythicShards` above) needs each shard type — drives which of the two shard-location groups
      // the Ascension card offers (plan: don't recommend a mythic-only node like a Mythic-tier
      // Extremis node for a below-Mythic range, and vice versa).
      ascensionNeedsRegularShards: (ascension?.shards ?? 0) > 0,
      ascensionNeedsMythicShards: (ascension?.mythicShards ?? 0) > 0,
      onslaughtTokens,
      onslaughtDays,
      combinedDays: Math.max(campaignDays, onslaughtDays),
    }
  }, [
    params,
    inventoryShard?.amount,
    currentOnslaughtTokens,
    onslaughtProgress,
    rewards,
  ])
}

function regularRewardKey(rarity: string) {
  return (
    ["Common", "Uncommon", "Rare", "Epic", "Legendary"].includes(rarity)
      ? rarity
      : "Legendary"
  ) as "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary"
}

function tokensFor(shards: number, reward: { min: number; max: number }) {
  return shards <= 0 ? 0 : Math.ceil(shards / ((reward.min + reward.max) / 2))
}

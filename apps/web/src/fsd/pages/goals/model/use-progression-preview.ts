import { useEffect, useMemo, useState } from "react"
import { useMsal } from "@azure/msal-react"
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
  getOnslaughtProgress,
  onslaughtReward,
  progressForAlliance,
  type OnslaughtProgress,
} from "@/entities/player-data-override"
import type { AscensionFarmingSource } from "@/entities/goal"

import { estimateGoal } from "./estimate/estimate"
import { shardResourceId } from "./estimate/estimate.domain"
import {
  ascensionResourceNeed,
  unlockResourceNeed,
} from "./progression-cost-calc"

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
}) {
  const { instance, accounts } = useMsal()
  const account = instance.getActiveAccount() ?? accounts[0]
  const accountId = account?.homeAccountId
  const inventoryShard = useLiveQuery(
    () => (params.entityId ? getInventoryShard(params.entityId) : undefined),
    [params.entityId]
  )
  const liveProgress = useLiveQuery(() => getLiveProgress(), [])
  const rewards = useLiveQuery(() => getOnslaughtRewards(), [])
  const currentOnslaughtTokens =
    liveProgress?.gameModeTokens.onslaught?.current ?? 0
  const [onslaughtProgress, setOnslaughtProgress] =
    useState<OnslaughtProgress>()

  useEffect(() => {
    if (!accountId) return undefined
    const stableAccount = instance
      .getAllAccounts()
      .find((candidate) => candidate.homeAccountId === accountId)
    if (!stableAccount) return undefined
    let active = true
    void getOnslaughtProgress(instance, stableAccount).then((progress) => {
      if (active) setOnslaughtProgress(progress)
    })
    return () => {
      active = false
    }
  }, [accountId, instance])

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
    const campaign =
      campaignEnabled && regularShards > 0 && params.character
        ? estimateGoal({
            needs: [{ id: shardId, count: regularShards }],
            upgradesById: new Map([
              [
                shardId,
                { id: shardId, farmLocations: params.character.shardLocations },
              ],
            ]),
            battlesById: params.battlesById,
            dailyEnergy: params.dailyEnergy,
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
    return {
      regularShards,
      mythicShards,
      orbsByType: ascension?.orbsByType ?? {},
      campaign,
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

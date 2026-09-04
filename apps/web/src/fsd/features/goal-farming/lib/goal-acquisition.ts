import type {
  CharacterStorageModel,
  GameCatalogShop,
  MowStorageModel,
  OnslaughtRewardStorageModel,
} from "@workspace/game-catalog"
import { resolveUnitShardShopOffers } from "@workspace/game-catalog"
import type { PlayerDataChunkDto } from "@workspace/player-data"

import type { AcquisitionSource, GoalDetail } from "@/entities/goal"
import {
  onslaughtReward,
  progressForAlliance,
  type OnslaughtProgress,
} from "@/entities/player-data-override"

import { projectOnslaughtSupply, projectShopSupply } from "./shop-supply"
import type { FlatSupplier } from "../model/estimate.domain"

type PlayerCharacter = PlayerDataChunkDto<"characters">[number]
type PlayerMow = PlayerDataChunkDto<"mows">[number]

export function isMowDetail(detail: GoalDetail) {
  return detail.entityType === "Mow"
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

/**
 * A goal's selected acquisition sources (tacticus-planner-apps#103), resolved into the flat
 * suppliers (Onslaught/Shop) and Campaign gating `estimatePlan`'s shared day-loop needs, plus the
 * Onslaught-token delta this goal contributes. Shared by every estimate consumer that needs to
 * fold a goal's persisted `acquisitionSources` into its farming demand — Insights
 * (`plan-insights-calc.ts`) and Today/Raids Plan (`daily-raids-calc.ts`) — so a shop/Onslaught
 * source reduces the derived campaign demand identically everywhere (spec: *Shared estimate
 * consumers use the same derived demand*). Lives in this feature (rather than under either
 * consumer's own `pages/` slice) since FSD forbids one page importing another page's internals.
 */
export function computeGoalAcquisition(params: {
  detail: GoalDetail
  need: { shards: number; mythicShards: number }
  mowsById: ReadonlyMap<string, MowStorageModel>
  charactersById: ReadonlyMap<string, CharacterStorageModel>
  playerCharacterById: ReadonlyMap<string, PlayerCharacter | undefined>
  playerMowById: ReadonlyMap<string, PlayerMow | undefined>
  onslaughtProgress?: OnslaughtProgress
  onslaughtRewards?: readonly OnslaughtRewardStorageModel[]
  shops?: readonly GameCatalogShop[]
  referenceDate: Date
}): {
  acquisitionSources: AcquisitionSource[] | null
  campaignSource: AcquisitionSource | undefined
  campaignShardsEnabled: boolean
  flatSuppliers: FlatSupplier[]
  onslaughtTokensDelta: number
} {
  const { detail, need } = params

  // Unlock/Ascension's selected acquisition sources (tacticus-planner-apps#103) — `null`/absent (a
  // goal predating this control, or any other goal type) reads as unrestricted campaign, no
  // Onslaught, no shop, matching the picker's own fromGoalConfig default.
  const acquisitionSources =
    detail.goalType === "Unlock" || detail.goalType === "Ascension"
      ? detail.config.acquisitionSources
      : null
  const campaignSource = acquisitionSources?.find(
    (source) => source.kind === "Campaign"
  )
  const onslaughtSource = acquisitionSources?.find(
    (source) => source.kind === "Onslaught"
  )
  const shopSource = acquisitionSources?.find(
    (source) => source.kind === "Shop"
  )
  const campaignShardsEnabled = acquisitionSources ? !!campaignSource : true
  const flatSuppliers: FlatSupplier[] = []
  let onslaughtTokensDelta = 0

  if (
    detail.goalType === "Ascension" &&
    detail.config.progression &&
    onslaughtSource &&
    params.onslaughtProgress
  ) {
    const entity = isMowDetail(detail)
      ? params.mowsById.get(detail.entityId)
      : params.charactersById.get(detail.entityId)
    const allianceProgress = progressForAlliance(
      params.onslaughtProgress,
      entity?.alliance ?? "Imperial"
    )
    const currentProgression = isMowDetail(detail)
      ? params.playerMowById.get(detail.entityId)?.progressionIndex
      : params.playerCharacterById.get(detail.entityId)?.progressionIndex
    const rarity = (
      currentProgression ?? detail.config.progression.start
    ).split(":")[0]
    const regularReward = onslaughtReward(
      params.onslaughtRewards ?? [],
      allianceProgress.sector,
      allianceProgress.tier,
      regularRewardKey(rarity)
    )
    const mythicReward = onslaughtReward(
      params.onslaughtRewards ?? [],
      allianceProgress.sector,
      allianceProgress.tier,
      "Mythic"
    )
    onslaughtTokensDelta += tokensFor(need.shards, regularReward)
    onslaughtTokensDelta += tokensFor(need.mythicShards, mythicReward)
    // Only the regular-shard resource enters the shared day-loop estimate below (mythic shards stay
    // count-only here, as they always have for this consumer); the aggregate onslaughtTokens figure
    // above still covers both.
    flatSuppliers.push(
      projectOnslaughtSupply({
        entityId: detail.entityId,
        isMythic: false,
        avgShardsPerRun: (regularReward.min + regularReward.max) / 2,
      })
    )
  }

  if (shopSource && params.shops?.length) {
    const offers = resolveUnitShardShopOffers(params.shops, detail.entityId)
    for (const offer of offers) {
      // Today/Insights/Raids Plan track mythic shards as a count only, never as day-loop demand
      // (`need.shardId` covers the regular resource alone; campaign mythic locations aren't fed into
      // this consumer's farm-location set either) — pre-existing scope this change doesn't extend, so
      // a selected mythic Shop offer is intentionally excluded from `flatSuppliers` here.
      if (offer.isMythic || !shopSource.ids.includes(offer.offerId)) continue
      flatSuppliers.push(projectShopSupply(offer, params.referenceDate))
    }
  }

  return {
    acquisitionSources,
    campaignSource,
    campaignShardsEnabled,
    flatSuppliers,
    onslaughtTokensDelta,
  }
}

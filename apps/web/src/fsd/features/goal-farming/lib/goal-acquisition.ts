import type {
  CharacterStorageModel,
  GameCatalogShop,
  MowStorageModel,
  OnslaughtRewardStorageModel,
  ShopRewardOffer,
} from "@workspace/game-catalog"
import {
  MYTHIC_UNCRAFTABLE_UPGRADE_IDS,
  resolveMythicMaterialShopOffers,
  resolveUnitShardShopOffers,
} from "@workspace/game-catalog"
import { progressionStarsIndex, type Progression } from "@workspace/game-domain"
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

/** Goal kinds whose Mythic upgrade-material needs can draw on shop offers
 *  (add-mythic-material-shop-sources). */
function takesMythicMaterialSources(detail: GoalDetail) {
  return (
    (detail.goalType === "Rank" && !isMowDetail(detail)) ||
    detail.goalType === "Upgrade" ||
    (detail.goalType === "Ability" && isMowDetail(detail))
  )
}

/** The needed ids that are one of the four shop-only Mythic upgrade materials. */
export function neededMythicMaterialIds(needIds: readonly string[]) {
  return [...new Set(needIds)].filter((id) =>
    MYTHIC_UNCRAFTABLE_UPGRADE_IDS.includes(id)
  )
}

/** The roster's stars by unit id, for shop lock resolution (the Crusade shop's Mythic-material offers
 *  are gated on owning a blue-star unit). */
export function rosterStarsByUnitId(
  units: Iterable<{ unitId: string; progressionIndex: string } | undefined>
) {
  const starsByUnitId: Record<string, number> = {}
  for (const unit of units) {
    if (unit)
      starsByUnitId[unit.unitId] = progressionStarsIndex(
        unit.progressionIndex as Progression
      )
  }
  return starsByUnitId
}

/**
 * The Mythic-material shop offers a goal uses: every available offer of each needed material when the
 * goal has no saved selection (`acquisitionSources` null — the default, never persisted), otherwise only
 * the offers its `Shop` entry names (an empty entry opts out).
 */
export function selectMythicMaterialOffers(
  acquisitionSources: readonly AcquisitionSource[] | null,
  offers: readonly ShopRewardOffer[]
) {
  if (!acquisitionSources) return [...offers]
  const ids =
    acquisitionSources.find((source) => source.kind === "Shop")?.ids ?? []
  return offers.filter((offer) => ids.includes(offer.offerId))
}

// No reward row for the player's sector/tier → Onslaught supplies nothing, so it costs no tokens
// here and contributes no flat supply below (spec: *A selected Onslaught source supplies its per-run
// shard yield*, missing-row scenario).
function tokensFor(
  shards: number,
  reward: { min: number; max: number } | undefined
) {
  if (!reward || shards <= 0) return 0
  return Math.ceil(shards / ((reward.min + reward.max) / 2))
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
  /** `upgrades` are the goal's farmable base-material needs; only Mythic-material ones matter here. */
  need: {
    shards: number
    mythicShards: number
    upgrades?: readonly { id: string }[]
  }
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
  /** The selected shop offers behind `flatSuppliers` (same `offerId` as each supplier's key), so a
   *  consumer can show their cost and shop without re-resolving. */
  shopOffers: ShopRewardOffer[]
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
  const shopOffers: ShopRewardOffer[] = []
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
    if (regularReward) {
      flatSuppliers.push(
        projectOnslaughtSupply({
          entityId: detail.entityId,
          isMythic: false,
          avgShardsPerRun: (regularReward.min + regularReward.max) / 2,
        })
      )
    }
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
      shopOffers.push(offer)
    }
  }

  if (takesMythicMaterialSources(detail) && params.shops?.length) {
    const materialIds = neededMythicMaterialIds(
      (need.upgrades ?? []).map((upgrade) => upgrade.id)
    )
    if (materialIds.length > 0) {
      const offers = resolveMythicMaterialShopOffers(
        params.shops,
        materialIds,
        {
          lockContext: {
            starsByUnitId: rosterStarsByUnitId([
              ...params.playerCharacterById.values(),
              ...params.playerMowById.values(),
            ]),
          },
          now: params.referenceDate.getTime(),
        }
      )
      for (const offer of selectMythicMaterialOffers(
        detail.config.acquisitionSources,
        offers
      )) {
        flatSuppliers.push(projectShopSupply(offer, params.referenceDate))
        shopOffers.push(offer)
      }
    }
  }

  return {
    acquisitionSources,
    campaignSource,
    campaignShardsEnabled,
    flatSuppliers,
    shopOffers,
    onslaughtTokensDelta,
  }
}

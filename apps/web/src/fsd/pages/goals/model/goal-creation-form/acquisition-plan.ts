import type { ShopShardOffer } from "@workspace/game-catalog"
import type { FarmLocation } from "@/shared/lib"

import type { AcquisitionSource } from "@/entities/goal"
import type { AcquisitionSourceSeed } from "./use-acquisition-source-selection"

// The canonical per-goal acquisition-source selection (plan: Campaigns/Onslaught/Shops picker,
// tacticus-planner-apps#103) — produced by `useAcquisitionSourceSelection`, consumed by the picker UI,
// `goal-spec-builder.ts`, and the farming-estimate preview alike, so detail rows and the aggregate
// estimate are always derived from the same selection (one canonical result structure).
export type GoalAcquisitionPlan = {
  campaign: {
    enabled: boolean
    regularBattleIds: string[]
    mythicBattleIds: string[]
  }
  /** Character Ascension only — see the picker spec's group-visibility rule. */
  onslaught: {
    enabled: boolean
  }
  /** Only the currently-selected offers — not every offer available for the unit. */
  shops: {
    enabled: boolean
    offers: ShopShardOffer[]
  }
}

export function emptyAcquisitionPlan(): GoalAcquisitionPlan {
  return {
    campaign: { enabled: true, regularBattleIds: [], mythicBattleIds: [] },
    onslaught: { enabled: false },
    shops: { enabled: false, offers: [] },
  }
}

/** Seeds `useAcquisitionSourceSelection` from a goal's persisted `acquisitionSources` (edit sheet —
 *  spec: *Goal created before this control existed*). `null`/absent (including a goal predating
 *  this control) becomes the unrestricted-campaign default, same as a fresh goal. A `Campaign`
 *  entry's ids are split back into regular/mythic by cross-referencing the unit's own shard-location
 *  lists (the server stores them together — see the API's `AcquisitionSource.Ids` doc). */
export function acquisitionSourceSeed(
  sources: readonly AcquisitionSource[] | null | undefined,
  regularShardLocations: readonly FarmLocation[],
  mythicShardLocations: readonly FarmLocation[]
): AcquisitionSourceSeed {
  if (!sources || sources.length === 0) {
    return {
      campaignEnabled: true,
      regularBattleIds: [],
      mythicBattleIds: [],
      onslaughtEnabled: false,
      shopOfferIds: [],
    }
  }

  const regularIds = new Set<string>(
    regularShardLocations.map((location) => location.battleId)
  )
  const mythicIds = new Set<string>(
    mythicShardLocations.map((location) => location.battleId)
  )
  const campaign = sources.find((source) => source.kind === "Campaign")
  const onslaught = sources.find((source) => source.kind === "Onslaught")
  const shop = sources.find((source) => source.kind === "Shop")

  return {
    campaignEnabled: !!campaign,
    regularBattleIds: campaign?.ids.filter((id) => regularIds.has(id)) ?? [],
    mythicBattleIds: campaign?.ids.filter((id) => mythicIds.has(id)) ?? [],
    onslaughtEnabled: !!onslaught,
    shopOfferIds: shop?.ids ?? [],
  }
}

/** The wire `acquisitionSources` for a plan — always an explicit array (never omitted), so an
 *  all-groups-off selection (spec: unselecting Campaigns excludes campaign farming entirely) sends a
 *  literal `[]` rather than relying on the server's absent/null default. Regular and mythic campaign
 *  battle ids combine into one `Campaign` entry, matching the server's `Ids` shape.
 *
 *  `isUnlock` restricts the result to what an Unlock goal can actually use — regular-shard-only,
 *  matching `unlockResourceNeed`'s always-zero mythic shards, and never `Onslaught` (server-rejected
 *  for Unlock; the picker never even shows the group there) — since a combined Unlock+Ascension
 *  creation shares one selection between both cards but must submit each goal's own valid subset. */
export function acquisitionSourcesFromPlan(
  plan: GoalAcquisitionPlan,
  { isUnlock = false }: { isUnlock?: boolean } = {}
): AcquisitionSource[] {
  const sources: AcquisitionSource[] = []
  if (plan.campaign.enabled) {
    sources.push({
      kind: "Campaign",
      ids: isUnlock
        ? [...plan.campaign.regularBattleIds]
        : [...plan.campaign.regularBattleIds, ...plan.campaign.mythicBattleIds],
    })
  }
  if (!isUnlock && plan.onslaught.enabled) {
    sources.push({ kind: "Onslaught", ids: [] })
  }
  if (plan.shops.enabled && plan.shops.offers.length > 0) {
    const offers = isUnlock
      ? plan.shops.offers.filter((offer) => !offer.isMythic)
      : plan.shops.offers
    if (offers.length > 0) {
      sources.push({
        kind: "Shop",
        ids: offers.map((offer) => offer.offerId),
      })
    }
  }
  return sources
}

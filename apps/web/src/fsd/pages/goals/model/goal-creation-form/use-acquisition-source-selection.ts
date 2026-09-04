import { useMemo, useState } from "react"

import type {
  CharacterStorageModel,
  ShopShardOffer,
  UnlockShardCostStorageModel,
} from "@workspace/game-catalog"
import type { FarmLocation } from "@/shared/lib"

import { dropRate, estimateGoal } from "@/features/goal-farming"
import { estimateRemainingShardEnergy } from "@/features/goal-farming"
import type { GoalAcquisitionPlan } from "./acquisition-plan"

/** The id of `locations`' lowest expected-energy-per-shard node (`battle.energyCost / dropRate`,
 *  the same per-item economics `GoalShardLocationsField`'s own per-location figure uses), or
 *  `undefined` when none price out (missing battle data, or a location with a zero drop rate). */
function cheapestLocationId(
  locations: readonly FarmLocation[],
  battlesById: Parameters<typeof estimateGoal>[0]["battlesById"]
): string | undefined {
  let bestId: string | undefined
  let bestEnergy = Number.POSITIVE_INFINITY
  for (const location of locations) {
    const battle = battlesById.get(location.battleId)
    const rate = dropRate(location)
    if (!battle || battle.energyCost <= 0 || rate <= 0) continue
    const energyPerShard = battle.energyCost / rate
    if (energyPerShard < bestEnergy) {
      bestEnergy = energyPerShard
      bestId = location.battleId
    }
  }
  return bestId
}

/** The default campaign-node selection for a fresh (never manually touched) entity: the lowest
 *  expected-energy-per-shard node of each type present, so an estimate is visible without the user
 *  picking anything first — mirrors the campaign-only default this control replaces (spec: *Default
 *  selection preserves campaign-only estimates*). */
function defaultLocationIds(
  regularShardLocations: readonly FarmLocation[],
  mythicShardLocations: readonly FarmLocation[],
  battlesById: Parameters<typeof estimateGoal>[0]["battlesById"]
): string[] {
  return [
    cheapestLocationId(regularShardLocations, battlesById),
    cheapestLocationId(mythicShardLocations, battlesById),
  ].filter((id): id is string => id != null)
}

/** A previously-saved selection to seed the control from (goal detail/edit — spec: *Goal created
 *  before this control existed* / round-trip through edit). Absent means "fresh goal", which uses
 *  the campaign-only lowest-energy default instead of an empty selection. */
export type AcquisitionSourceSeed = {
  campaignEnabled: boolean
  regularBattleIds: string[]
  mythicBattleIds: string[]
  onslaughtEnabled: boolean
  shopOfferIds: string[]
}

/**
 * The Unlock/Ascension acquisition-source selection (plan: Campaigns/Onslaught/Shops picker,
 * tacticus-planner-apps#103) — which top-level groups are selected, which of the unit's campaign
 * shard-farm nodes are checked (split by type, mythic-vs-regular filtering unchanged from before this
 * control existed), and which of the unit's resolved shop offers (`shopOffers`, from
 * `useUnitShopShardSupply`) are checked. Replaces `useShardLocationSelection` — every campaign-node
 * concern it owned (default selection, per-type split, the Unlock "energy for remaining shards" line)
 * is preserved verbatim; Onslaught/Shops are new. Derives one canonical `GoalAcquisitionPlan` (D4) that
 * both the picker UI and the farming estimate read from.
 */
export function useAcquisitionSourceSelection(params: {
  entityType: "Character" | "Mow"
  entityId: string | undefined
  charactersById: ReadonlyMap<string, CharacterStorageModel> | undefined
  unlockShardCostsById:
    ReadonlyMap<string, UnlockShardCostStorageModel> | undefined
  lockedShards: number | undefined
  battlesById: Parameters<typeof estimateGoal>[0]["battlesById"]
  dailyEnergy: number
  /** The unit's resolved shop shard offers (any subset may currently be selected) — `undefined`
   *  while still loading. A selection made before this resolves is preserved (spec: *selection
   *  retained during data load*), since selection state is plain ids, not offer objects. */
  shopOffers?: readonly ShopShardOffer[]
  /** Seeds the initial selection from a previously-saved goal (edit sheet). Omit for a fresh goal. */
  seed?: AcquisitionSourceSeed | null
}) {
  const characterView =
    params.entityType === "Character" && params.entityId
      ? params.charactersById?.get(params.entityId)
      : undefined

  const regularShardLocations = useMemo(
    () =>
      characterView?.shardLocations.filter((location) => !location.isMythic) ??
      [],
    [characterView]
  )
  const mythicShardLocations = useMemo(
    () =>
      characterView?.shardLocations.filter((location) => location.isMythic) ??
      [],
    [characterView]
  )

  // `null` means "no explicit user edit yet for this entity" — `shardLocationIds` below then reads
  // the live default instead, unless a seed was given (edit sheet), in which case that becomes the
  // starting selection. Reset back to `null` by `reset()` (entity switch, "create another").
  const [manualSelection, setManualSelection] = useState<string[] | null>(() =>
    params.seed
      ? [...params.seed.regularBattleIds, ...params.seed.mythicBattleIds]
      : null
  )
  const [campaignEnabled, setCampaignEnabled] = useState(
    () => params.seed?.campaignEnabled ?? true
  )
  const [onslaughtEnabled, setOnslaughtEnabled] = useState(
    () => params.seed?.onslaughtEnabled ?? false
  )
  const [shopsEnabled, setShopsEnabled] = useState(
    () => (params.seed?.shopOfferIds.length ?? 0) > 0
  )
  const [manualShopOfferIds, setManualShopOfferIds] = useState<string[] | null>(
    () => params.seed?.shopOfferIds ?? null
  )

  const defaultShardLocationIds = useMemo(
    () =>
      defaultLocationIds(
        regularShardLocations,
        mythicShardLocations,
        params.battlesById
      ),
    [regularShardLocations, mythicShardLocations, params.battlesById]
  )
  const shardLocationIds = manualSelection ?? defaultShardLocationIds

  const toggleShardLocation = (battleId: string, enabled: boolean) => {
    setManualSelection((current) => {
      const base = current ?? defaultShardLocationIds
      return enabled
        ? [...base, battleId]
        : base.filter((id) => id !== battleId)
    })
  }

  const selectedShopOfferIds = useMemo(
    () => manualShopOfferIds ?? [],
    [manualShopOfferIds]
  )
  const toggleShopOffer = (offerId: string, enabled: boolean) => {
    // Checking an offer implies the Shops group itself — otherwise a checked offer with the
    // group still off is silently excluded from the plan with no visual cue why (the group
    // starts unselected, unlike Campaigns, which defaults to enabled).
    if (enabled) setShopsEnabled(true)
    setManualShopOfferIds((current) => {
      const base = current ?? []
      return enabled ? [...base, offerId] : base.filter((id) => id !== offerId)
    })
  }

  /** Replaces the current selection with `seed`'s (or the fresh-goal default when `null`) —
   *  imperative, for a caller-driven re-seed rather than a lazy initial value (edit sheet: re-seed
   *  from the goal's saved config each time the user enters edit mode, since the hook instance
   *  there is long-lived across `view`/`edit` toggles rather than remounted per goal). */
  const reseed = (nextSeed: AcquisitionSourceSeed | null) => {
    setManualSelection(
      nextSeed
        ? [...nextSeed.regularBattleIds, ...nextSeed.mythicBattleIds]
        : null
    )
    setCampaignEnabled(nextSeed?.campaignEnabled ?? true)
    setOnslaughtEnabled(nextSeed?.onslaughtEnabled ?? false)
    setShopsEnabled((nextSeed?.shopOfferIds.length ?? 0) > 0)
    setManualShopOfferIds(nextSeed?.shopOfferIds ?? null)
  }

  const reset = () => reseed(null)

  const selectedRegularShardLocationIds = useMemo(() => {
    const regularIds = new Set<string>(
      regularShardLocations.map((location) => location.battleId)
    )
    return shardLocationIds.filter((id) => regularIds.has(id))
  }, [shardLocationIds, regularShardLocations])
  const selectedMythicShardLocationIds = useMemo(() => {
    const mythicIds = new Set<string>(
      mythicShardLocations.map((location) => location.battleId)
    )
    return shardLocationIds.filter((id) => mythicIds.has(id))
  }, [shardLocationIds, mythicShardLocations])

  const selectedShopOffers = useMemo(
    () =>
      (params.shopOffers ?? []).filter((offer) =>
        selectedShopOfferIds.includes(offer.offerId)
      ),
    [params.shopOffers, selectedShopOfferIds]
  )

  const plan: GoalAcquisitionPlan = useMemo(
    () => ({
      campaign: {
        enabled: campaignEnabled,
        regularBattleIds: selectedRegularShardLocationIds,
        mythicBattleIds: selectedMythicShardLocationIds,
      },
      onslaught: { enabled: onslaughtEnabled },
      shops: { enabled: shopsEnabled, offers: selectedShopOffers },
    }),
    [
      campaignEnabled,
      selectedRegularShardLocationIds,
      selectedMythicShardLocationIds,
      onslaughtEnabled,
      shopsEnabled,
      selectedShopOffers,
    ]
  )

  // "X out of Y shards required to unlock at R" + the energy to farm the remainder from the
  // selected shard locations (plan: Unlock resources-needed format) — Character only, and only once
  // the catalog's per-rarity unlock-shard table has loaded. Regular shards only, matching
  // `unlockResourceNeed`'s always-zero mythicShards for Unlock. Unaffected by campaign/Onslaught/Shops
  // group toggles — it's a campaign-only farming-time figure, unchanged from before this control.
  const unlockRequirement = useMemo(() => {
    if (params.entityType !== "Character" || !params.entityId) return null
    const rarity = characterView?.initialRarity
    const totalShards = rarity
      ? params.unlockShardCostsById?.get(rarity)?.shards
      : 0
    if (!rarity || !totalShards) return null

    const ownedShards = params.lockedShards ?? 0
    const remainingShards = Math.max(0, totalShards - ownedShards)
    const energyEstimate =
      selectedRegularShardLocationIds.length > 0
        ? estimateRemainingShardEnergy({
            entityId: params.entityId,
            remainingShards,
            shardLocations: regularShardLocations,
            battlesById: params.battlesById,
            farmingLocationIds: selectedRegularShardLocationIds,
            dailyEnergy: params.dailyEnergy,
          })
        : null

    return { ownedShards, totalShards, rarity, energyEstimate }
  }, [
    params.entityType,
    params.entityId,
    characterView,
    params.unlockShardCostsById,
    params.lockedShards,
    params.battlesById,
    regularShardLocations,
    selectedRegularShardLocationIds,
    params.dailyEnergy,
  ])

  return {
    // Campaign node selection (ported from useShardLocationSelection).
    shardLocationIds,
    toggleShardLocation,
    regularShardLocations,
    mythicShardLocations,
    selectedRegularShardLocationIds,
    selectedMythicShardLocationIds,
    unlockRequirement,
    // Group enable/disable.
    campaignEnabled,
    setCampaignEnabled,
    onslaughtEnabled,
    setOnslaughtEnabled,
    shopsEnabled,
    setShopsEnabled,
    // Shop offer selection.
    selectedShopOfferIds,
    toggleShopOffer,
    // Canonical plan + reset/reseed.
    plan,
    reset,
    reseed,
  }
}

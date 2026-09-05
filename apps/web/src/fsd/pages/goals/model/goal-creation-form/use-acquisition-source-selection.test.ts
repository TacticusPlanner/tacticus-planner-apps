import { act, renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import type {
  CharacterStorageModel,
  ShopShardOffer,
} from "@workspace/game-catalog"
import {
  battleIdSchema,
  campaignIdSchema,
  type BattleId,
} from "@workspace/game-domain"

import type { Battle } from "@/features/goal-farming"
import { useAcquisitionSourceSelection } from "./use-acquisition-source-selection"

const battleId = battleIdSchema.parse
const campaignId = campaignIdSchema.parse

const battle = (energyCost: number): Battle => ({
  campaignGroupId: campaignId("campaign1"),
  type: "Standard",
  challenge: false,
  nodeNumber: 1,
  energyCost,
  dailyAttempts: 10,
})

const characterView = {
  id: "hero1",
  initialRarity: "Common",
  shardLocations: [
    { battleId: battleId("cheap"), guaranteed: true, isMythic: false },
    { battleId: battleId("expensive"), guaranteed: true, isMythic: false },
    { battleId: battleId("mythic"), guaranteed: true, isMythic: true },
  ],
} as unknown as CharacterStorageModel

const battlesById = new Map<BattleId, Battle>([
  [battleId("cheap"), battle(10)],
  [battleId("expensive"), battle(100)],
  [battleId("mythic"), battle(20)],
])

const guildOffer: ShopShardOffer = {
  offerId: "guild:shards_hero1",
  shopId: "guild",
  unitId: "hero1",
  rewardType: "shards_hero1",
  isMythic: false,
  rewardQty: 5,
  cost: { currency: "guildCredits", amount: 525 },
  maxPerDay: 2,
  days: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
  probabilityByDay: {
    MON: 1,
    TUE: 1,
    WED: 1,
    THU: 1,
    FRI: 1,
    SAT: 1,
    SUN: 1,
  },
}

function setup(
  overrides: Partial<Parameters<typeof useAcquisitionSourceSelection>[0]> = {}
) {
  return renderHook(
    (props: Parameters<typeof useAcquisitionSourceSelection>[0]) =>
      useAcquisitionSourceSelection(props),
    {
      initialProps: {
        entityType: "Character",
        entityId: "hero1",
        charactersById: new Map([["hero1", characterView]]),
        unlockShardCostsById: new Map(),
        lockedShards: 0,
        battlesById,
        dailyEnergy: 288,
        ...overrides,
      },
    }
  )
}

describe("useAcquisitionSourceSelection — campaign nodes (ported from useShardLocationSelection)", () => {
  it("defaults to the lowest energy-per-shard node of each type, without any manual selection", () => {
    const { result } = setup()

    expect(result.current.shardLocationIds).toEqual(["cheap", "mythic"])
    expect(result.current.selectedRegularShardLocationIds).toEqual(["cheap"])
    expect(result.current.selectedMythicShardLocationIds).toEqual(["mythic"])
  })

  it("respects a manual deselect of the default down to zero, rather than fighting it back on", () => {
    const { result } = setup()

    act(() => result.current.toggleShardLocation("cheap", false))

    expect(result.current.shardLocationIds).toEqual(["mythic"])
    expect(result.current.selectedRegularShardLocationIds).toEqual([])
  })

  it("restores the live default once reset() is called", () => {
    const { result } = setup()
    act(() => result.current.toggleShardLocation("cheap", false))

    act(() => result.current.reset())

    expect(result.current.shardLocationIds).toEqual(["cheap", "mythic"])
  })
})

describe("useAcquisitionSourceSelection — default group selection", () => {
  it("defaults Campaigns on and Onslaught/Shops off", () => {
    const { result } = setup()

    expect(result.current.plan).toEqual({
      campaign: {
        enabled: true,
        regularBattleIds: ["cheap"],
        mythicBattleIds: ["mythic"],
      },
      onslaught: { enabled: false },
      shops: { enabled: false, offers: [] },
    })
  })

  it("unselecting Campaigns excludes it from the plan entirely", () => {
    const { result } = setup()

    act(() => result.current.setCampaignEnabled(false))

    expect(result.current.plan.campaign.enabled).toBe(false)
  })

  it("toggling Onslaught and Shops includes them in the plan", () => {
    const { result } = setup({ shopOffers: [guildOffer] })

    act(() => {
      result.current.setOnslaughtEnabled(true)
      result.current.setShopsEnabled(true)
      result.current.toggleShopOffer(guildOffer.offerId, true)
    })

    expect(result.current.plan.onslaught.enabled).toBe(true)
    expect(result.current.plan.shops).toEqual({
      enabled: true,
      offers: [guildOffer],
    })
  })

  it("checking a shop offer auto-enables the Shops group, unlike unchecking it", () => {
    const { result } = setup({ shopOffers: [guildOffer] })

    act(() => result.current.toggleShopOffer(guildOffer.offerId, true))
    expect(result.current.shopsEnabled).toBe(true)
    expect(result.current.plan.shops).toEqual({
      enabled: true,
      offers: [guildOffer],
    })

    act(() => result.current.toggleShopOffer(guildOffer.offerId, false))
    expect(result.current.shopsEnabled).toBe(true)
    expect(result.current.plan.shops.offers).toEqual([])
  })

  it("keeps a selected shop offer id even while shopOffers is still loading", () => {
    const { result, rerender } = setup({ shopOffers: [guildOffer] })
    act(() => {
      result.current.setShopsEnabled(true)
      result.current.toggleShopOffer(guildOffer.offerId, true)
    })
    expect(result.current.plan.shops.offers).toEqual([guildOffer])

    rerender({
      entityType: "Character",
      entityId: "hero1",
      charactersById: new Map([["hero1", characterView]]),
      unlockShardCostsById: new Map(),
      lockedShards: 0,
      battlesById,
      dailyEnergy: 288,
      shopOffers: undefined, // simulates the shops query still loading
    })

    expect(result.current.selectedShopOfferIds).toEqual([guildOffer.offerId])
    expect(result.current.plan.shops.offers).toEqual([]) // not resolvable yet, but not lost

    rerender({
      entityType: "Character",
      entityId: "hero1",
      charactersById: new Map([["hero1", characterView]]),
      unlockShardCostsById: new Map(),
      lockedShards: 0,
      battlesById,
      dailyEnergy: 288,
      shopOffers: [guildOffer],
    })
    expect(result.current.plan.shops.offers).toEqual([guildOffer])
  })
})

describe("useAcquisitionSourceSelection — seeded from an existing goal", () => {
  it("seeds group selection and campaign node split from a saved plan", () => {
    const { result } = setup({
      shopOffers: [guildOffer],
      seed: {
        campaignEnabled: true,
        regularBattleIds: ["expensive"],
        mythicBattleIds: ["mythic"],
        onslaughtEnabled: true,
        shopOfferIds: [guildOffer.offerId],
      },
    })

    expect(result.current.plan).toEqual({
      campaign: {
        enabled: true,
        regularBattleIds: ["expensive"],
        mythicBattleIds: ["mythic"],
      },
      onslaught: { enabled: true },
      shops: { enabled: true, offers: [guildOffer] },
    })
  })

  it("a legacy goal with no seed falls back to the fresh-goal default", () => {
    const { result } = setup({ seed: undefined })

    expect(result.current.plan.campaign.enabled).toBe(true)
    expect(result.current.plan.onslaught.enabled).toBe(false)
    expect(result.current.plan.shops.enabled).toBe(false)
  })
})

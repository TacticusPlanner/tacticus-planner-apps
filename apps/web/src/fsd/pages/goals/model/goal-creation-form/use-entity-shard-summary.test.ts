import { describe, expect, it } from "vitest"

import type { ShopShardOffer } from "@workspace/game-catalog"

import { isUnlockAvailable } from ".//use-entity-shard-summary"

const offer = (isMythic: boolean) => ({ isMythic }) as ShopShardOffer

const base = {
  entityType: "Character" as const,
  isOwned: false,
  hasEntityId: true,
  campaignLocationCount: 0,
  shopOffers: undefined as readonly ShopShardOffer[] | undefined,
}

describe("isUnlockAvailable", () => {
  it("is available for a campaign-only character", () => {
    expect(isUnlockAvailable({ ...base, campaignLocationCount: 2 })).toBe(true)
  })

  it("is available for a shop-only character (Kharn/Ragnar)", () => {
    expect(isUnlockAvailable({ ...base, shopOffers: [offer(false)] })).toBe(
      true
    )
  })

  it("is unavailable when only mythic shop offers exist", () => {
    expect(isUnlockAvailable({ ...base, shopOffers: [offer(true)] })).toBe(
      false
    )
  })

  it("is unavailable with no source, while offers load, or without an entity", () => {
    expect(isUnlockAvailable({ ...base, shopOffers: [] })).toBe(false)
    expect(isUnlockAvailable(base)).toBe(false)
    expect(
      isUnlockAvailable({
        ...base,
        hasEntityId: false,
        campaignLocationCount: 1,
      })
    ).toBe(false)
  })

  it("is unavailable when already owned", () => {
    expect(
      isUnlockAvailable({
        ...base,
        isOwned: true,
        campaignLocationCount: 1,
        shopOffers: [offer(false)],
      })
    ).toBe(false)
  })

  it("is offered for an unowned Mow", () => {
    expect(isUnlockAvailable({ ...base, entityType: "Mow" })).toBe(true)
  })
})

import { describe, expect, it } from "vitest"

import {
  guildRaidMetaBossSchema,
  guildRaidMetaHeroSlotSchema,
  guildRaidMetaPayloadSchema,
  guildRaidMetaPrimeSchema,
  guildRaidMetaRecommendationSchema,
} from "./guild-raid-meta"

function heroSlot(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    heroId: "hero-1",
    roleId: "flex",
    essential: false,
    replacementCharacterIds: [],
    ...overrides,
  }
}

function recommendation(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "rec-1",
    kind: "meta",
    heroSlots: [
      heroSlot({ heroId: "hero-1" }),
      heroSlot({ heroId: "hero-2" }),
      heroSlot({ heroId: "hero-3" }),
      heroSlot({ heroId: "hero-4" }),
      heroSlot({ heroId: "hero-5" }),
    ],
    mowId: "mow-1",
    mowReplacementIds: [],
    compIds: ["comp-1"],
    efficiency: 1,
    ...overrides,
  }
}

describe("guildRaidMetaHeroSlotSchema", () => {
  it("accepts a complete valid slot, including a non-empty replacement list", () => {
    expect(guildRaidMetaHeroSlotSchema.safeParse(heroSlot()).success).toBe(true)
    expect(
      guildRaidMetaHeroSlotSchema.safeParse(
        heroSlot({ replacementCharacterIds: ["hero-9", "hero-8"] })
      ).success
    ).toBe(true)
  })

  it("rejects a replacement list that repeats the slot's own heroId", () => {
    const result = guildRaidMetaHeroSlotSchema.safeParse(
      heroSlot({ heroId: "hero-1", replacementCharacterIds: ["hero-1"] })
    )
    expect(result.success).toBe(false)
  })

  it("rejects duplicate replacement ids within one slot", () => {
    const result = guildRaidMetaHeroSlotSchema.safeParse(
      heroSlot({ replacementCharacterIds: ["hero-9", "hero-9"] })
    )
    expect(result.success).toBe(false)
  })

  it("rejects a missing roleId", () => {
    const result = guildRaidMetaHeroSlotSchema.safeParse(
      heroSlot({ roleId: "" })
    )
    expect(result.success).toBe(false)
  })
})

describe("guildRaidMetaRecommendationSchema", () => {
  it("accepts complete valid data", () => {
    expect(
      guildRaidMetaRecommendationSchema.safeParse(recommendation()).success
    ).toBe(true)
  })

  it("accepts a free-form kind, not just 'meta'/'alternate'", () => {
    expect(
      guildRaidMetaRecommendationSchema.safeParse(
        recommendation({ kind: "lavistodes" })
      ).success
    ).toBe(true)
  })

  it.each(["id", "kind", "heroSlots", "mowReplacementIds", "efficiency"])(
    "rejects a recommendation missing %s",
    (field) => {
      const rest: Partial<Record<string, unknown>> = recommendation()
      delete rest[field]
      expect(guildRaidMetaRecommendationSchema.safeParse(rest).success).toBe(
        false
      )
    }
  )

  it("rejects a non-positive efficiency", () => {
    expect(
      guildRaidMetaRecommendationSchema.safeParse(
        recommendation({ efficiency: 0 })
      ).success
    ).toBe(false)
    expect(
      guildRaidMetaRecommendationSchema.safeParse(
        recommendation({ efficiency: -1 })
      ).success
    ).toBe(false)
  })

  it("accepts an efficiency exceeding the 1.0 baseline", () => {
    expect(
      guildRaidMetaRecommendationSchema.safeParse(
        recommendation({ efficiency: 1.86 })
      ).success
    ).toBe(true)
  })

  it("rejects fewer than five hero slots", () => {
    const result = guildRaidMetaRecommendationSchema.safeParse(
      recommendation({ heroSlots: [heroSlot({ heroId: "hero-1" })] })
    )
    expect(result.success).toBe(false)
  })

  it("rejects a Machine-of-War replacement list that repeats its own mowId", () => {
    const result = guildRaidMetaRecommendationSchema.safeParse(
      recommendation({ mowReplacementIds: ["mow-1"] })
    )
    expect(result.success).toBe(false)
  })

  it("rejects duplicate Machine-of-War replacement entries", () => {
    const result = guildRaidMetaRecommendationSchema.safeParse(
      recommendation({ mowReplacementIds: ["mow-2", "mow-2"] })
    )
    expect(result.success).toBe(false)
  })

  it("accepts an authored empty replacement list distinctly from an absent one", () => {
    const result = guildRaidMetaRecommendationSchema.safeParse(recommendation())
    expect(result.success).toBe(true)
    if (result.success) {
      expect(
        result.data.heroSlots.every((slot) => slot.replacementCharacterIds)
      ).toBe(true)
      expect(result.data.heroSlots[0]?.replacementCharacterIds).toEqual([])
    }
  })
})

describe("guildRaidMetaBossSchema", () => {
  function boss(recommendations: Record<string, unknown>[], overrides = {}) {
    return {
      bossUnitSetId: "boss-1",
      primeUnitSetIds: [],
      recommendations,
      ...overrides,
    }
  }

  it("accepts a boss with more than two distinct-kind recommendations", () => {
    const result = guildRaidMetaBossSchema.safeParse(
      boss([
        recommendation({ id: "rec-1", kind: "lavistodes" }),
        recommendation({ id: "rec-2", kind: "neuro" }),
        recommendation({ id: "rec-3", kind: "battlesuit" }),
      ])
    )
    expect(result.success).toBe(true)
  })

  it("rejects a duplicate kind within one boss group", () => {
    const result = guildRaidMetaBossSchema.safeParse(
      boss([
        recommendation({ id: "rec-1", kind: "lavistodes" }),
        recommendation({ id: "rec-2", kind: "lavistodes" }),
      ])
    )
    expect(result.success).toBe(false)
  })

  it("accepts an ordered primeUnitSetIds list", () => {
    const result = guildRaidMetaBossSchema.safeParse(
      boss([recommendation()], { primeUnitSetIds: ["prime-2", "prime-1"] })
    )
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.primeUnitSetIds).toEqual(["prime-2", "prime-1"])
    }
  })
})

describe("guildRaidMetaPrimeSchema", () => {
  it("accepts a prime with one or more recommendations", () => {
    const result = guildRaidMetaPrimeSchema.safeParse({
      primeUnitSetId: "prime-1",
      recommendations: [recommendation()],
    })
    expect(result.success).toBe(true)
  })

  it("rejects a duplicate kind within one prime group", () => {
    const result = guildRaidMetaPrimeSchema.safeParse({
      primeUnitSetId: "prime-1",
      recommendations: [
        recommendation({ id: "rec-1", kind: "admech" }),
        recommendation({ id: "rec-2", kind: "admech" }),
      ],
    })
    expect(result.success).toBe(false)
  })
})

describe("guildRaidMetaPayloadSchema", () => {
  const comp = {
    id: "comp-1",
    signatureUnitId: "hero-1",
    coreCharacterIds: ["hero-1"],
    flexCharacterIds: ["hero-6"],
    mowIds: ["mow-1", "mow-2"],
  }

  function payload(
    recommendations: Record<string, unknown>[],
    overrides: Partial<Record<string, unknown>> = {}
  ) {
    return {
      sourceId: "source",
      updatedOn: "2026-07-01",
      comps: [comp],
      bosses: [
        { bossUnitSetId: "boss-1", primeUnitSetIds: [], recommendations },
      ],
      primes: [],
      ...overrides,
    }
  }

  it("accepts a complete valid payload", () => {
    expect(
      guildRaidMetaPayloadSchema.safeParse(payload([recommendation()])).success
    ).toBe(true)
  })

  it("accepts a payload with a primes[] entry", () => {
    const raw = payload([recommendation()], {
      bosses: [
        {
          bossUnitSetId: "boss-1",
          primeUnitSetIds: ["prime-1"],
          recommendations: [recommendation()],
        },
      ],
      primes: [
        {
          primeUnitSetId: "prime-1",
          recommendations: [recommendation({ id: "prime-rec-1" })],
        },
      ],
    })
    const result = guildRaidMetaPayloadSchema.safeParse(raw)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.primes).toHaveLength(1)
      expect(result.data.primes[0]?.primeUnitSetId).toBe("prime-1")
    }
  })

  it("rejects duplicate recommendation ids across the whole dataset, even across different bosses", () => {
    const raw = {
      sourceId: "source",
      updatedOn: "2026-07-01",
      comps: [comp],
      bosses: [
        {
          bossUnitSetId: "boss-1",
          primeUnitSetIds: [],
          recommendations: [recommendation({ id: "shared" })],
        },
        {
          bossUnitSetId: "boss-2",
          primeUnitSetIds: [],
          recommendations: [recommendation({ id: "shared" })],
        },
      ],
      primes: [],
    }
    expect(guildRaidMetaPayloadSchema.safeParse(raw).success).toBe(false)
  })

  it("rejects duplicate recommendation ids shared between a boss and a prime group", () => {
    const raw = payload([recommendation({ id: "shared" })], {
      bosses: [
        {
          bossUnitSetId: "boss-1",
          primeUnitSetIds: ["prime-1"],
          recommendations: [recommendation({ id: "shared" })],
        },
      ],
      primes: [
        {
          primeUnitSetId: "prime-1",
          recommendations: [recommendation({ id: "shared" })],
        },
      ],
    })
    expect(guildRaidMetaPayloadSchema.safeParse(raw).success).toBe(false)
  })

  it("allows the same replacement character to be reused across different slots and recommendations", () => {
    const shared = recommendation({
      id: "rec-a",
      heroSlots: [
        heroSlot({ heroId: "hero-1", replacementCharacterIds: ["hero-6"] }),
        heroSlot({ heroId: "hero-2", replacementCharacterIds: ["hero-6"] }),
        heroSlot({ heroId: "hero-3" }),
        heroSlot({ heroId: "hero-4" }),
        heroSlot({ heroId: "hero-5" }),
      ],
    })
    const other = recommendation({
      id: "rec-b",
      kind: "alternate",
      heroSlots: [
        heroSlot({ heroId: "hero-1", replacementCharacterIds: ["hero-6"] }),
        heroSlot({ heroId: "hero-2" }),
        heroSlot({ heroId: "hero-3" }),
        heroSlot({ heroId: "hero-4" }),
        heroSlot({ heroId: "hero-5" }),
      ],
    })

    expect(
      guildRaidMetaPayloadSchema.safeParse(payload([shared, other])).success
    ).toBe(true)
  })
})

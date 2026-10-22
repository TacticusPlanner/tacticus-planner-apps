import { describe, expect, it } from "vitest"

import { act, renderHook } from "@/test/render"
import { seedGameCatalog, seedPlayerData } from "@/test/seed"

import { useGuildRaidInvestmentReadiness } from "./use-guild-raid-investment-readiness"

function heroSlots(heroIds: string[]) {
  return heroIds.map((heroId) => ({
    heroId,
    roleId: "flex",
    essential: false,
    replacementCharacterIds: [],
  }))
}

const bossUnitSetId = "Boss1"

const meta = {
  sourceId: "source",
  updatedOn: "2026-07-01",
  comps: [],
  bosses: [
    {
      bossUnitSetId,
      primeUnitSetIds: [],
      recommendations: [
        {
          id: "Boss1-meta",
          kind: "meta",
          heroSlots: heroSlots(["heroA", "heroB", "heroC", "heroD", "heroE"]),
          mowId: "mowX",
          mowReplacementIds: [],
          compIds: [],
          efficiency: 1,
        },
      ],
    },
  ],
  primes: [],
}

const catalogBoss = {
  unitSetId: bossUnitSetId,
  kind: "boss" as const,
  isPrimarch: false,
  factionId: "faction",
  movement: 3,
  statProgression: [
    {
      health: 1,
      damage: 1,
      fixedArmor: 1,
      rank: 0,
      starLevel: 0,
      baseRarity: "Common",
      progressionIndex: 5,
      abilityLevel: 1,
    },
  ],
}

/** Renders the hook and lets its live reads settle, so "unavailable" is never the loading render. */
async function renderReadiness(isObservationActive = true) {
  const rendered = renderHook(() =>
    useGuildRaidInvestmentReadiness({
      bossUnitSetId,
      isObservationActive,
      liveProgressionIndex: 1,
    })
  )
  await act(() => new Promise((resolve) => setTimeout(resolve, 50)))
  return rendered
}

describe("useGuildRaidInvestmentReadiness", () => {
  it("is unavailable while the catalog is still loading", () => {
    // Nothing is seeded and the first render precedes every live read.
    const { result } = renderHook(() =>
      useGuildRaidInvestmentReadiness({
        bossUnitSetId,
        isObservationActive: true,
        liveProgressionIndex: 1,
      })
    )

    expect(result.current).toEqual({ status: "unavailable" })
  })

  it("is unavailable when the guild has no active observation, even with all data synced", async () => {
    await seedGameCatalog({
      "guild-raid-meta": meta,
      "raid-bosses": { bosses: [catalogBoss], primes: [] },
    })
    await seedPlayerData({ characters: [], mows: [] })

    const { result } = await renderReadiness(false)

    expect(result.current).toEqual({ status: "unavailable" })
  })

  it("is unavailable when the boss has no catalog raid-boss record", async () => {
    await seedGameCatalog({
      "guild-raid-meta": meta,
      "raid-bosses": { bosses: [], primes: [] },
    })
    await seedPlayerData({ characters: [], mows: [] })

    const { result } = await renderReadiness()

    expect(result.current).toEqual({ status: "unavailable" })
  })

  it("resolves a ready result keyed by recommendation id when every input is present", async () => {
    await seedGameCatalog({
      "guild-raid-meta": meta,
      "raid-bosses": { bosses: [catalogBoss], primes: [] },
    })
    await seedPlayerData({
      characters: [
        {
          unitId: "heroA",
          xpLevel: 10,
          rank: "Gold1",
          progressionIndex: "Epic:RedOneStar",
          abilities: [{ level: 30 }, { level: 30 }],
        },
      ],
      mows: [],
    })

    const { result } = await renderReadiness()

    expect(result.current.status).toBe("ready")
    if (result.current.status !== "ready") return
    const entry = result.current.byRecommendationId.get("Boss1-meta")
    expect(entry).toBeDefined()
    expect(entry!.heroSlots.map((slot) => slot.heroId)).toEqual([
      "heroA",
      "heroB",
      "heroC",
      "heroD",
      "heroE",
    ])
    // heroA is owned and invested; the other four are unowned — team readiness sits above 0.
    expect(entry!.teamReadiness).toBeGreaterThan(0)
  })
})

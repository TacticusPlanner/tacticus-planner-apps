import { describe, expect, it } from "vitest"

import { act, renderHook } from "@/test/render"
import { seedGameCatalog } from "@/test/seed"

import { useGuildRaidReadinessThreshold } from "./use-guild-raid-readiness-threshold"

const bossUnitSetId = "Boss1"

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

/** Renders the hook and lets its live reads settle, so `null` is never the loading render. */
async function renderThreshold(isObservationActive = true) {
  const rendered = renderHook(() =>
    useGuildRaidReadinessThreshold({
      bossUnitSetId,
      isObservationActive,
      liveProgressionIndex: 1,
    })
  )
  await act(() => new Promise((resolve) => setTimeout(resolve, 50)))
  return rendered
}

describe("useGuildRaidReadinessThreshold", () => {
  it("is null while the catalog is still loading", () => {
    // Nothing is seeded and the first render precedes every live read.
    const { result } = renderHook(() =>
      useGuildRaidReadinessThreshold({
        bossUnitSetId,
        isObservationActive: true,
        liveProgressionIndex: 1,
      })
    )

    expect(result.current).toBeNull()
  })

  it("is null when the guild has no active observation, even with all data synced", async () => {
    await seedGameCatalog({
      "raid-bosses": { bosses: [catalogBoss], primes: [] },
    })

    const { result } = await renderThreshold(false)

    expect(result.current).toBeNull()
  })

  it("is null when the boss has no catalog raid-boss record", async () => {
    await seedGameCatalog({
      "raid-bosses": { bosses: [], primes: [] },
    })

    const { result } = await renderThreshold()

    expect(result.current).toBeNull()
  })

  it("resolves the boss step's target when every input is present", async () => {
    await seedGameCatalog({
      "raid-bosses": { bosses: [catalogBoss], primes: [] },
    })

    const { result } = await renderThreshold()

    expect(result.current).toMatchObject({
      progression: "Uncommon:FourStars",
      requiredRank: "Bronze1",
      requiredAbilityLevel: 17,
    })
  })
})

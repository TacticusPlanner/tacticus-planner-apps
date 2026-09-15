import { describe, expect, it } from "vitest"

import {
  resolveGuildRaidInvestmentThreshold,
  resolveGuildRaidLiveInvestmentThreshold,
} from "./resolve-guild-raid-investment-threshold"

function step(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    health: 1,
    damage: 1,
    fixedArmor: 1,
    rank: 0,
    starLevel: 0,
    baseRarity: "Common",
    progressionIndex: 0,
    abilityLevel: 1,
    ...overrides,
  }
}

// A trimmed stand-in for a real 27-step raid-boss ladder: first step at progressionIndex 0
// (Common:None), a mid-ladder step at progressionIndex 9 (Epic:RedOneStar), and two final steps that
// both carry progressionIndex 19 (Mythic:MythicWings) alongside a raw boss `rank`/`abilityLevel` far
// above any character cap — mirroring the real data's last two steps (rank 19-20, abilityLevel 62-65).
const steps = [
  step({ progressionIndex: 0, rank: 0, abilityLevel: 1 }),
  step({ progressionIndex: 9, rank: 9, abilityLevel: 27 }),
  step({ progressionIndex: 19, rank: 19, abilityLevel: 62 }),
  step({ progressionIndex: 19, rank: 20, abilityLevel: 65 }),
]

describe("resolveGuildRaidInvestmentThreshold", () => {
  it("returns null when the boss has no progression steps", () => {
    expect(
      resolveGuildRaidInvestmentThreshold({ statProgression: [] }, 1)
    ).toBeNull()
  })

  it("derives the first step's threshold", () => {
    const threshold = resolveGuildRaidInvestmentThreshold(
      { statProgression: steps },
      1
    )
    expect(threshold?.progression).toBe("Common:None")
    expect(threshold?.requiredRank).toBe("Iron1")
    expect(threshold?.requiredProgressionIndex).toBe(0)
    expect(threshold?.requiredAbilityLevel).toBe(8)
  })

  it("derives a mid-ladder step's threshold", () => {
    const threshold = resolveGuildRaidInvestmentThreshold(
      { statProgression: steps },
      2
    )
    expect(threshold?.progression).toBe("Epic:RedOneStar")
    expect(threshold?.requiredRank).toBe("Gold1")
    expect(threshold?.requiredProgressionIndex).toBe(9)
    expect(threshold?.requiredAbilityLevel).toBe(35)
  })

  it("derives the last step's threshold without reading its above-cap raw rank/abilityLevel fields", () => {
    const threshold = resolveGuildRaidInvestmentThreshold(
      { statProgression: steps },
      4
    )
    // The raw step carries rank: 20 and abilityLevel: 65 — neither a real character rank index nor a
    // reachable ability level. The derivation must produce the real character-ladder ceiling instead
    // of leaking either raw field through.
    expect(threshold?.progression).toBe("Mythic:MythicWings")
    expect(threshold?.requiredRank).toBe("Adamantine2")
    expect(threshold?.requiredProgressionIndex).toBe(19)
    expect(threshold?.requiredAbilityLevel).toBe(60)
  })

  it("clamps an out-of-range live progressionIndex instead of throwing", () => {
    expect(
      resolveGuildRaidInvestmentThreshold({ statProgression: steps }, 0)
        ?.progression
    ).toBe("Common:None")
    expect(
      resolveGuildRaidInvestmentThreshold({ statProgression: steps }, 999)
        ?.progression
    ).toBe("Mythic:MythicWings")
  })
})

describe("resolveGuildRaidLiveInvestmentThreshold", () => {
  it("falls back to null when the guild has no observed season", () => {
    expect(
      resolveGuildRaidLiveInvestmentThreshold({
        boss: { statProgression: steps },
        isObservationActive: false,
        liveProgressionIndex: 2,
      })
    ).toBeNull()
  })

  it("falls back to null when the boss's live status is absent", () => {
    expect(
      resolveGuildRaidLiveInvestmentThreshold({
        boss: { statProgression: steps },
        isObservationActive: true,
        liveProgressionIndex: undefined,
      })
    ).toBeNull()
  })

  it("derives the threshold when the season is active and a live progressionIndex is present", () => {
    const threshold = resolveGuildRaidLiveInvestmentThreshold({
      boss: { statProgression: steps },
      isObservationActive: true,
      liveProgressionIndex: 2,
    })
    expect(threshold?.progression).toBe("Epic:RedOneStar")
  })
})

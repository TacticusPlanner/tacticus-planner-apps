import { describe, expect, it } from "vitest"

import type { GoalDetail } from "@/entities/goal"

import { computeGoalProgress } from "./goal-progress"

function rankDetail(start: number, end: number, endAppliedUpgrades = 0) {
  return {
    entityType: "Character",
    goalType: "Rank",
    config: {
      rank: {
        start,
        end,
        startPointFive: false,
        startAppliedUpgrades: 0,
        endPointFive: false,
        endAppliedUpgrades,
      },
    },
  } as GoalDetail
}

// Unrestricted rarity/level so tests unrelated to the reachable-ceiling feature see
// `reachableRatio: null` and their existing rank/level assertions are unaffected.
const UNRESTRICTED = { progressionIndex: "Mythic:MythicWings", xpLevel: 60 }

describe("computeGoalProgress Rank", () => {
  it("measures a same-rank partial target by applied slots", () => {
    expect(
      computeGoalProgress({
        detail: rankDetail(1, 1, 2),
        playerCharacter: {
          rank: "Stone2",
          appliedUpgradeSlots: [0],
          ...UNRESTRICTED,
        },
      } as never)
    ).toMatchObject({ kind: "Rank", ratio: 0.5 })
  })

  it("includes applied slots between full rank boundaries", () => {
    expect(
      computeGoalProgress({
        detail: rankDetail(0, 2),
        playerCharacter: {
          rank: "Stone1",
          appliedUpgradeSlots: [0, 2, 4],
          ...UNRESTRICTED,
        },
      } as never)
    ).toMatchObject({ kind: "Rank", ratio: 0.25 })
  })

  it("does not complete an ahead-of-player clean rank target with a zero configured span", () => {
    expect(
      computeGoalProgress({
        detail: rankDetail(2, 2),
        playerCharacter: {
          rank: "Stone1",
          appliedUpgradeSlots: [],
          ...UNRESTRICTED,
        },
      } as never)
    ).toMatchObject({ kind: "Rank", ratio: 0 })
  })

  it("clamps the displayed current to the target once the player's live rank has overtaken it (fix-goal-progress-consistency)", () => {
    expect(
      computeGoalProgress({
        detail: rankDetail(0, 15),
        playerCharacter: {
          rank: "Diamond3",
          appliedUpgradeSlots: [],
          ...UNRESTRICTED,
        },
      } as never)
    ).toMatchObject({ kind: "Rank", current: "Diamond1", ratio: 1 })
  })

  it("never raises the displayed current above the player's true rank when it's below the target's configured start (fix-goal-progress-consistency)", () => {
    expect(
      computeGoalProgress({
        detail: rankDetail(5, 15),
        playerCharacter: {
          rank: "Stone1",
          appliedUpgradeSlots: [],
          ...UNRESTRICTED,
        },
      } as never)
    ).toMatchObject({ kind: "Rank", current: "Stone1" })
  })

  it("returns null reachableRatio and reachableRank when rarity and level both already cover the target", () => {
    expect(
      computeGoalProgress({
        detail: rankDetail(0, 5),
        playerCharacter: {
          rank: "Stone1",
          appliedUpgradeSlots: [],
          ...UNRESTRICTED,
        },
      } as never)
    ).toMatchObject({
      kind: "Rank",
      reachableRatio: null,
      reachableRank: null,
      reachableRankLimitedBy: null,
    })
  })

  it("caps reachableRatio and reachableRank by rarity when rarity is the tighter bound", () => {
    // Rare caps at Silver1 (index 9); Diamond1 target end is index 15. Level 60 is high enough
    // that Silver1's own slots are maxed out (6/6) — rarity blocks ranking any further, not level.
    expect(
      computeGoalProgress({
        detail: rankDetail(0, 15),
        playerCharacter: {
          rank: "Stone1",
          appliedUpgradeSlots: [],
          progressionIndex: "Rare:FourStars",
          xpLevel: 60,
        },
      } as never)
    ).toMatchObject({
      kind: "Rank",
      reachableRatio: (9 * 6 + 6) / 90,
      reachableRank: "Silver1",
      reachableAppliedSlots: 6,
      reachableRankLimitedBy: "rarity",
    })
  })

  it("caps reachableRatio and reachableRank by level when level is the tighter bound", () => {
    // Level 20 reaches Bronze2 (index 7) with its own 3 free slots (rankToLevel.Bronze2 === 20,
    // the level just reached); rarity (Mythic) is unrestricted.
    expect(
      computeGoalProgress({
        detail: rankDetail(0, 15),
        playerCharacter: {
          rank: "Stone1",
          appliedUpgradeSlots: [],
          progressionIndex: "Mythic:MythicWings",
          xpLevel: 20,
        },
      } as never)
    ).toMatchObject({
      kind: "Rank",
      reachableRatio: (7 * 6 + 3) / 90,
      reachableRank: "Bronze2",
      reachableAppliedSlots: 3,
      reachableRankLimitedBy: "level",
    })
  })

  it("caps reachableRatio and reachableRank by the lower of rarity and level when both restrict equally", () => {
    // Rare caps at Silver1 (index 9); level 26 also just reaches Silver1 (its own 3 free slots).
    expect(
      computeGoalProgress({
        detail: rankDetail(0, 15),
        playerCharacter: {
          rank: "Stone1",
          appliedUpgradeSlots: [],
          progressionIndex: "Rare:FourStars",
          xpLevel: 26,
        },
      } as never)
    ).toMatchObject({
      kind: "Rank",
      reachableRatio: (9 * 6 + 3) / 90,
      reachableRank: "Silver1",
      reachableAppliedSlots: 3,
      reachableRankLimitedBy: "both",
    })
  })

  it("reproduces a real fixture (Shiron: Rare rarity, level 17) where level caps below what rarity alone would allow", () => {
    // Rare's rarity cap is Silver1 (index 9); level 17 only reaches Bronze1 (index 6) per
    // rankToLevel. Level is the tighter bound here even though the character's rarity would allow
    // much further — confirmed live against the running app, since this looked like a bug at first
    // glance ("Rare rarity should mean Silver1") until the character's actual low level was
    // accounted for.
    expect(
      computeGoalProgress({
        detail: rankDetail(0, 15),
        playerCharacter: {
          rank: "Stone1",
          appliedUpgradeSlots: [],
          progressionIndex: "Rare:FiveStars",
          xpLevel: 17,
        },
      } as never)
    ).toMatchObject({
      kind: "Rank",
      reachableRank: "Bronze1",
      reachableAppliedSlots: 3,
      reachableRankLimitedBy: "level",
    })
  })

  it("never places the reachable ceiling behind the character's real, level-gated applied-slot progress (real fixture: Neurothrope, Diamond1 partial)", () => {
    // A whole-rank-only ceiling was the bug: at level 46 (mid-way through Diamond1's own
    // level-gated bottom row), the old model reported the ceiling as "just reached Diamond1" (0 of
    // its slots credited) while the character's real applied-slot count was already 3 — visibly
    // placing the ceiling marker *behind* the actual-progress fill. `reachableAppliedSlots` must
    // credit the same partial-rank progress the actual ratio itself already does.
    const result = computeGoalProgress({
      detail: rankDetail(15, 17), // Diamond1 -> Diamond3
      playerCharacter: {
        rank: "Diamond1",
        appliedUpgradeSlots: [0, 1, 2],
        progressionIndex: "Legendary:RedThreeStars", // unrestricted rarity (caps at Diamond3)
        xpLevel: 46,
      },
    } as never)
    expect(result).toMatchObject({
      kind: "Rank",
      ratio: 3 / 12,
      reachableRatio: 5 / 12,
      reachableRank: "Diamond1",
      reachableAppliedSlots: 5,
    })
    expect(
      (result as { reachableRatio: number }).reachableRatio
    ).toBeGreaterThanOrEqual((result as { ratio: number }).ratio)
  })

  it("returns null reachableRatio and reachableRank for a zero-span target regardless of rarity/level", () => {
    expect(
      computeGoalProgress({
        detail: rankDetail(2, 2),
        playerCharacter: {
          rank: "Stone1",
          appliedUpgradeSlots: [],
          progressionIndex: "Common:None",
          xpLevel: 1,
        },
      } as never)
    ).toMatchObject({ kind: "Rank", reachableRatio: null, reachableRank: null })
  })
})

function ascensionDetail(start: string, end: string) {
  return {
    entityType: "Character",
    goalType: "Ascension",
    config: { progression: { start, end } },
  } as GoalDetail
}

describe("computeGoalProgress Ascension", () => {
  it("clamps the displayed current to the target once the player's live progression has overtaken it (fix-goal-progress-consistency)", () => {
    expect(
      computeGoalProgress({
        detail: ascensionDetail("Common:None", "Rare:FiveStars"),
        playerCharacter: { progressionIndex: "Epic:RedOneStar" },
      } as never)
    ).toMatchObject({
      kind: "Ascension",
      current: "Rare:FiveStars",
      ratio: 1,
    })
  })

  it("never raises the displayed current above the player's true progression when it's below the target's configured start (fix-goal-progress-consistency)", () => {
    expect(
      computeGoalProgress({
        detail: ascensionDetail("Uncommon:FourStars", "Rare:FiveStars"),
        playerCharacter: { progressionIndex: "Common:TwoStars" },
      } as never)
    ).toMatchObject({ kind: "Ascension", current: "Common:TwoStars" })
  })
})

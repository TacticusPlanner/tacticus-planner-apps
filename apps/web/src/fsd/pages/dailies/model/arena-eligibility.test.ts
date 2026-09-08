import { describe, expect, it } from "vitest"

import { unitIdSchema, type UnitId } from "@workspace/game-domain"

import {
  contributionByUnitId,
  expandCandidatePool,
  isXpCapped,
  poolUnitIds,
} from "./arena-eligibility"
import type { ArenaRosterCharacter } from "./arena-recommendations.types"

const id = (value: string): UnitId => unitIdSchema.parse(value)

const character = (
  value: string,
  over: Partial<ArenaRosterCharacter> = {}
): ArenaRosterCharacter => ({
  unitId: id(value),
  rank: "Stone1",
  progression: "Common:None",
  xpLevel: 3,
  appliedUpgradeCount: 0,
  activeAbilityLevel: 1,
  passiveAbilityLevel: 1,
  ...over,
})

describe("isXpCapped", () => {
  it("is true at or above the progression tier's level cap", () => {
    expect(
      isXpCapped(character("a", { progression: "Common:None", xpLevel: 8 }))
    ).toBe(true)
    expect(
      isXpCapped(
        character("b", { progression: "Epic:RedOneStar", xpLevel: 35 })
      )
    ).toBe(true)
    expect(
      isXpCapped(
        character("c", { progression: "Mythic:MythicWings", xpLevel: 60 })
      )
    ).toBe(true)
  })

  it("is false below the tier cap — the character can still earn XP", () => {
    expect(
      isXpCapped(
        character("a", { progression: "Epic:RedOneStar", xpLevel: 34 })
      )
    ).toBe(false)
    expect(
      isXpCapped(
        character("b", { progression: "Legendary:RedThreeStars", xpLevel: 49 })
      )
    ).toBe(false)
  })
})

describe("contributionByUnitId", () => {
  it("keeps the first contribution per unit id", () => {
    const map = contributionByUnitId([
      { unitId: id("x"), goalId: "g1" },
      { unitId: id("x"), goalId: "g2" },
      { unitId: id("y"), goalId: "g3", projectId: "p1" },
    ])
    expect(map.get(id("x"))?.goalId).toBe("g1")
    expect(map.get(id("y"))?.projectId).toBe("p1")
    expect(map.size).toBe(2)
  })
})

describe("poolUnitIds", () => {
  const params = {
    rosterIds: [id("a"), id("b"), id("c"), id("d")],
    ownedProjectContributorIds: new Set([id("b")]),
    ownedGoalContributorIds: new Set([id("b"), id("d")]),
  }

  it("returns pool members in roster order", () => {
    expect(poolUnitIds("active-project", params)).toEqual([id("b")])
    expect(poolUnitIds("overall-goals", params)).toEqual([id("b"), id("d")])
    expect(poolUnitIds("full-roster", params)).toEqual(params.rosterIds)
  })
})

describe("expandCandidatePool", () => {
  const rosterIds = [id("a"), id("b"), id("c"), id("d"), id("e")]
  const base = {
    rosterIds,
    ownedProjectContributorIds: new Set([id("a"), id("b"), id("c")]),
    ownedGoalContributorIds: new Set([id("a"), id("b"), id("c"), id("d")]),
    isEligible: () => true,
  }

  it("does not broaden when the primary pool already has enough eligible characters", () => {
    const result = expandCandidatePool({
      ...base,
      primaryPool: "active-project",
    })
    expect(result.poolUsed).toBe("active-project")
    expect(result.broadened).toBe(false)
    expect(result.candidateIds).toEqual([id("a"), id("b"), id("c")])
  })

  it("widens to the next pool when the primary one is short of the minimum", () => {
    const result = expandCandidatePool({
      ...base,
      ownedProjectContributorIds: new Set([id("a"), id("b")]),
      primaryPool: "active-project",
    })
    expect(result.poolUsed).toBe("overall-goals")
    expect(result.broadened).toBe(true)
    expect(result.candidateIds).toEqual([id("a"), id("b"), id("c"), id("d")])
  })

  it("keeps widening to the full roster and de-duplicates across pools", () => {
    const result = expandCandidatePool({
      ...base,
      ownedProjectContributorIds: new Set([id("a")]),
      ownedGoalContributorIds: new Set([id("a"), id("b")]),
      primaryPool: "active-project",
    })
    expect(result.poolUsed).toBe("full-roster")
    expect(result.broadened).toBe(true)
    expect(result.candidateIds).toEqual(rosterIds)
  })

  it("counts only eligible characters toward the minimum", () => {
    const eligible = new Set([id("d"), id("e")])
    const result = expandCandidatePool({
      ...base,
      primaryPool: "active-project",
      isEligible: (unitId) => eligible.has(unitId),
    })
    // a/b/c are contributors but ineligible, so the pool widens until 3 eligible are reachable.
    expect(result.poolUsed).toBe("full-roster")
    expect(result.broadened).toBe(true)
  })
})

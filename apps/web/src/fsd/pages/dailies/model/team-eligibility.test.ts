import { describe, expect, it } from "vitest"

import { unitIdSchema, type UnitId } from "@workspace/game-domain"

import { expandCandidatePool, isXpCapped } from "./team-eligibility"
import type {
  TeamPoolSpec,
  TeamRosterCharacter,
} from "./team-recommendations.types"

const id = (value: string): UnitId => unitIdSchema.parse(value)

const character = (
  value: string,
  over: Partial<TeamRosterCharacter> = {}
): TeamRosterCharacter => ({
  unitId: id(value),
  rank: "Stone1",
  progression: "Common:None",
  xpLevel: 3,
  appliedUpgradeCount: 0,
  activeAbilityLevel: 1,
  passiveAbilityLevel: 1,
  traits: [],
  damageTypes: [],
  ...over,
})

const pool = (id: string, unitIds: UnitId[]): TeamPoolSpec => ({
  id,
  unitIds: new Set(unitIds),
  rationaleFor: () => undefined,
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

describe("expandCandidatePool", () => {
  const rosterIds = [id("a"), id("b"), id("c"), id("d"), id("e")]

  it("does not broaden when the primary pool already has enough eligible characters", () => {
    const result = expandCandidatePool({
      rosterIds,
      pools: [pool("active-project", [id("a"), id("b"), id("c")])],
      isEligible: () => true,
    })
    expect(result.poolUsed).toBe("active-project")
    expect(result.broadened).toBe(false)
    expect(result.candidateIds).toEqual([id("a"), id("b"), id("c")])
  })

  it("widens to the next pool when the primary one is short of the minimum", () => {
    const result = expandCandidatePool({
      rosterIds,
      pools: [
        pool("active-project", [id("a"), id("b")]),
        pool("overall-goals", [id("a"), id("b"), id("c"), id("d")]),
      ],
      isEligible: () => true,
    })
    expect(result.poolUsed).toBe("overall-goals")
    expect(result.broadened).toBe(true)
    expect(result.candidateIds).toEqual([id("a"), id("b"), id("c"), id("d")])
  })

  it("keeps widening into the implicit full roster and de-duplicates across pools", () => {
    const result = expandCandidatePool({
      rosterIds,
      pools: [
        pool("active-project", [id("a")]),
        pool("overall-goals", [id("a"), id("b")]),
      ],
      isEligible: () => true,
    })
    expect(result.poolUsed).toBe("full-roster")
    expect(result.broadened).toBe(true)
    expect(result.candidateIds).toEqual(rosterIds)
  })

  it("counts only eligible characters toward the minimum", () => {
    const eligible = new Set([id("d"), id("e")])
    const result = expandCandidatePool({
      rosterIds,
      pools: [pool("active-project", [id("a"), id("b"), id("c")])],
      isEligible: (unitId) => eligible.has(unitId),
    })
    // a/b/c are in the primary pool but ineligible, so it widens until 3 eligible are reachable.
    expect(result.poolUsed).toBe("full-roster")
    expect(result.broadened).toBe(true)
  })

  it("stops at the three-character minimum when no target is given", () => {
    const result = expandCandidatePool({
      rosterIds,
      pools: [
        pool("active-project", [id("a"), id("b"), id("c"), id("d")]),
        pool("overall-goals", [id("e")]),
      ],
      isEligible: () => true,
    })
    // Four eligible in the primary pool already clears the default minimum of three.
    expect(result.broadened).toBe(false)
    expect(result.candidateIds).toEqual([id("a"), id("b"), id("c"), id("d")])
  })

  it("keeps widening past three when targetEligible asks for more", () => {
    const result = expandCandidatePool({
      rosterIds,
      pools: [
        pool("active-project", [id("a"), id("b")]),
        pool("overall-goals", [id("c"), id("d")]),
      ],
      isEligible: () => true,
      targetEligible: 5,
    })
    // The two pools supply four eligible; a fifth is still wanted, so it widens into the roster.
    expect(result.poolUsed).toBe("full-roster")
    expect(result.broadened).toBe(true)
    expect(result.candidateIds).toEqual(rosterIds)
  })

  it("clamps targetEligible up to the three-character minimum", () => {
    const result = expandCandidatePool({
      rosterIds,
      pools: [pool("active-project", [id("a"), id("b")])],
      isEligible: () => true,
      targetEligible: 1,
    })
    expect(result.candidateIds).toEqual(rosterIds)
    expect(result.broadened).toBe(true)
  })
})

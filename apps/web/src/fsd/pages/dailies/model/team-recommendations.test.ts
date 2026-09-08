import { describe, expect, it } from "vitest"

import { unitIdSchema, type UnitId } from "@workspace/game-domain"

import { buildTeamRecommendations } from "./team-recommendations"
import type {
  BuildTeamRecommendationsInput,
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

const pool = (
  poolId: string,
  unitIds: UnitId[],
  goalId = poolId
): TeamPoolSpec => ({
  id: poolId,
  unitIds: new Set(unitIds),
  rationaleFor: () => ({ kind: "goal", goalId }),
})

const build = (
  over: Partial<BuildTeamRecommendationsInput> = {}
): BuildTeamRecommendationsInput => ({
  mode: "xp",
  teamSize: 3,
  roster: [character("a"), character("b"), character("c")],
  pools: [],
  preferences: {},
  lockedRandomUnitIds: [],
  randomSeed: 0,
  ...over,
})

const planOf = (input: BuildTeamRecommendationsInput) =>
  buildTeamRecommendations(input).categories.find((c) => c.id === "plan")!
const randomOf = (input: BuildTeamRecommendationsInput) =>
  buildTeamRecommendations(input).categories.find((c) => c.id === "random")!

describe("buildTeamRecommendations — pool configuration", () => {
  it("ranks a higher-priority pool's members ahead of a lower one's", () => {
    const roster = ["a", "b", "c", "d", "e"].map((v) => character(v))
    const plan = planOf(
      build({
        roster,
        teamSize: 3,
        pools: [
          pool("primary", [id("d"), id("e")]),
          pool("secondary", [id("a"), id("b"), id("c")]),
        ],
      })
    )
    expect(plan.members.slice(0, 2).map((m) => m.unitId)).toEqual([
      id("d"),
      id("e"),
    ])
    expect(plan.broadened).toBe(true)
    expect(plan.poolUsed).toBe("secondary")
  })

  it("uses each winning pool's rationale, falling back to minimum-size", () => {
    const roster = ["a", "b", "c", "d"].map((v) => character(v))
    const plan = planOf(
      build({
        roster,
        teamSize: 4,
        pools: [pool("primary", [id("a")], "g-primary")],
      })
    )
    expect(plan.members.find((m) => m.unitId === id("a"))?.rationale).toEqual({
      kind: "goal",
      goalId: "g-primary",
    })
    expect(plan.members.find((m) => m.unitId === id("d"))?.rationale).toEqual({
      kind: "minimum-size",
    })
  })

  it("widens past the minimum to fill the requested size, roster fillers ranked last", () => {
    const roster = Array.from({ length: 8 }, (_, index) =>
      character(`u${index}`)
    )
    const plan = planOf(
      build({
        roster,
        teamSize: 5,
        pools: [
          pool("primary", [id("u0"), id("u1")], "g-primary"),
          pool("secondary", [id("u2"), id("u3")], "g-secondary"),
        ],
      })
    )
    // Two pools supply four eligible; a fifth is drawn from the wider roster.
    expect(plan.deliveredSize).toBe(5)
    expect(plan.members.map((m) => m.unitId)).toEqual([
      id("u0"),
      id("u1"),
      id("u2"),
      id("u3"),
      id("u4"),
    ])
    expect(plan.broadened).toBe(true)
    expect(plan.poolUsed).toBe("full-roster")
    expect(plan.members[4].rationale).toEqual({ kind: "minimum-size" })
  })

  it("still stops at three in XP mode when only two are XP-eligible, even at size five", () => {
    const roster = [
      character("a"),
      character("b"),
      ...Array.from({ length: 6 }, (_, index) =>
        character(`c${index}`, { progression: "Common:None", xpLevel: 8 })
      ),
    ]
    const plan = planOf(build({ roster, mode: "xp", teamSize: 5 }))
    expect(plan.deliveredSize).toBe(3)
    expect(plan.includedCappedCharacters).toBe(true)
  })

  it("never re-adds a character the caller left out of the roster", () => {
    const roster = ["a", "b", "c"].map((v) => character(v))
    const result = buildTeamRecommendations(
      build({
        roster,
        teamSize: 5,
        pools: [pool("primary", [id("a"), id("zzz")])],
      })
    )
    for (const category of result.categories) {
      for (const member of category.members) {
        expect(["a", "b", "c"]).toContain(member.unitId)
      }
    }
  })
})

describe("buildTeamRecommendations — XP mode", () => {
  it("keeps XP-capped characters out of a team above the minimum size", () => {
    const roster = [
      character("a"),
      character("b"),
      character("c"),
      character("d"),
      character("e", { progression: "Common:None", xpLevel: 8 }),
    ]
    const plan = planOf(build({ roster, mode: "xp", teamSize: 5 }))
    expect(plan.members.map((m) => m.unitId)).not.toContain(id("e"))
    expect(plan.deliveredSize).toBe(4)
    expect(plan.includedCappedCharacters).toBe(false)
  })

  it("fills to the minimum with capped characters and flags it", () => {
    const roster = [
      character("a"),
      character("b", { progression: "Common:None", xpLevel: 8 }),
      character("c", { progression: "Common:None", xpLevel: 8 }),
      character("d", { progression: "Common:None", xpLevel: 8 }),
    ]
    const plan = planOf(build({ roster, mode: "xp", teamSize: 5 }))
    expect(plan.deliveredSize).toBe(3)
    expect(plan.includedCappedCharacters).toBe(true)
  })
})

describe("buildTeamRecommendations — Power mode", () => {
  it("orders by combat power then unit id", () => {
    const roster = [
      character("a", { rank: "Stone1" }),
      character("b", { rank: "Iron3" }),
      character("c", { rank: "Bronze3" }),
    ]
    const plan = planOf(build({ roster, mode: "power", teamSize: 3 }))
    // Bronze3 > Iron3 > Stone1 by combat power.
    expect(plan.members.map((m) => m.unitId)).toEqual([
      id("c"),
      id("b"),
      id("a"),
    ])
  })
})

describe("buildTeamRecommendations — preferences", () => {
  const flyers = (count: number, total: number) =>
    Array.from({ length: total }, (_, index) =>
      character(`u${index}`, {
        traits: index < count ? ["Flying"] : [],
      })
    )

  it("restricts every category to a satisfiable preferred trait", () => {
    const roster = flyers(5, 8)
    const result = buildTeamRecommendations(
      build({ roster, teamSize: 5, preferences: { trait: "Flying" } })
    )
    for (const category of result.categories) {
      for (const member of category.members) {
        expect(["u0", "u1", "u2", "u3", "u4"]).toContain(member.unitId)
      }
    }
  })

  it("widens the pool and flags broadened when the primary pool is short on matches", () => {
    const roster = flyers(4, 8)
    const plan = planOf(
      build({
        roster,
        teamSize: 4,
        preferences: { trait: "Flying" },
        pools: [pool("primary", [id("u0"), id("u5"), id("u6"), id("u7")])],
      })
    )
    expect(plan.broadened).toBe(true)
    expect(plan.members.map((m) => m.unitId).sort()).toEqual([
      "u0",
      "u1",
      "u2",
      "u3",
    ])
  })

  it("tops up from non-matching characters so a preference never shrinks the team", () => {
    const roster = flyers(2, 8)
    const plan = planOf(
      build({ roster, teamSize: 5, preferences: { trait: "Flying" } })
    )
    expect(plan.deliveredSize).toBe(5)
    expect(
      plan.members
        .slice(0, 2)
        .map((m) => m.unitId)
        .sort()
    ).toEqual(["u0", "u1"])
  })

  it("ignores a preference that no owned character satisfies", () => {
    const roster = flyers(0, 8)
    const withPref = buildTeamRecommendations(
      build({ roster, teamSize: 5, preferences: { trait: "Flying" } })
    )
    const withoutPref = buildTeamRecommendations(
      build({ roster, teamSize: 5, preferences: {} })
    )
    expect(JSON.stringify(withPref)).toBe(JSON.stringify(withoutPref))
  })

  it("tags every member with the active preferred trait / damage type and whether it matches", () => {
    const roster = [
      character("a", { traits: ["Flying"], damageTypes: ["Bolter"] }),
      character("b", { traits: ["Flying"], damageTypes: ["Physical"] }),
      character("c"),
      character("d"),
      character("e"),
    ]
    const plan = planOf(
      build({
        roster,
        teamSize: 5,
        preferences: { trait: "Flying", damageType: "Bolter" },
      })
    )
    const byId = new Map(plan.members.map((m) => [m.unitId, m]))
    expect(byId.get(id("a"))?.preferredTrait).toEqual({
      id: "Flying",
      matched: true,
    })
    expect(byId.get(id("a"))?.preferredDamageType).toEqual({
      id: "Bolter",
      matched: true,
    })
    expect(byId.get(id("b"))?.preferredTrait).toEqual({
      id: "Flying",
      matched: true,
    })
    expect(byId.get(id("b"))?.preferredDamageType).toEqual({
      id: "Bolter",
      matched: false,
    })
    expect(byId.get(id("c"))?.preferredTrait).toEqual({
      id: "Flying",
      matched: false,
    })
    expect(byId.get(id("c"))?.preferredDamageType).toEqual({
      id: "Bolter",
      matched: false,
    })
  })

  it("sets no preference tags when no preference is active", () => {
    const roster = ["a", "b", "c"].map((v) =>
      character(v, { traits: ["Flying"], damageTypes: ["Bolter"] })
    )
    for (const member of planOf(build({ roster, teamSize: 3 })).members) {
      expect(member.preferredTrait).toBeUndefined()
      expect(member.preferredDamageType).toBeUndefined()
    }
  })

  it("leaves Power-mode ordering identical when no preference is set", () => {
    const roster = ["a", "b", "c", "d", "e", "f"].map((v, index) =>
      character(v, { rank: index % 2 === 0 ? "Iron1" : "Bronze1" })
    )
    const withEmpty = planOf(build({ roster, mode: "power", teamSize: 5 }))
    const withUnset = planOf(
      build({
        roster,
        mode: "power",
        teamSize: 5,
        preferences: { trait: undefined, damageType: undefined },
      })
    )
    expect(withEmpty.members.map((m) => m.unitId)).toEqual(
      withUnset.members.map((m) => m.unitId)
    )
  })
})

describe("buildTeamRecommendations — Random team", () => {
  it("keeps locked characters across a regenerate and only re-draws the rest", () => {
    const roster = Array.from({ length: 8 }, (_, index) =>
      character(`u${index}`)
    )
    const target = id("u0")
    const first = randomOf(
      build({
        roster,
        teamSize: 5,
        lockedRandomUnitIds: [target],
        randomSeed: 0,
      })
    )
    const second = randomOf(
      build({
        roster,
        teamSize: 5,
        lockedRandomUnitIds: [target],
        randomSeed: 1,
      })
    )
    expect(first.members.map((m) => m.unitId)).toContain(target)
    expect(second.members.map((m) => m.unitId)).toContain(target)
    expect(second.members.find((m) => m.unitId === target)?.locked).toBe(true)
    expect(first.members.map((m) => m.unitId)).not.toEqual(
      second.members.map((m) => m.unitId)
    )
  })

  it("narrows the draw to preference matches, falling back when too few match", () => {
    const roster = Array.from({ length: 8 }, (_, index) =>
      character(`u${index}`, { traits: index < 6 ? ["Flying"] : [] })
    )
    const matched = randomOf(
      build({ roster, teamSize: 5, preferences: { trait: "Flying" } })
    )
    expect(matched.members.map((m) => m.unitId).every((v) => v !== "u6")).toBe(
      true
    )
    expect(matched.members.map((m) => m.unitId).every((v) => v !== "u7")).toBe(
      true
    )

    const fewRoster = Array.from({ length: 8 }, (_, index) =>
      character(`u${index}`, { traits: index < 3 ? ["Flying"] : [] })
    )
    const fellBack = randomOf(
      build({
        roster: fewRoster,
        teamSize: 5,
        preferences: { trait: "Flying" },
      })
    )
    expect(fellBack.members).toHaveLength(5)
  })
})

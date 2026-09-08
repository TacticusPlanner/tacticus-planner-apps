import { describe, expect, it } from "vitest"

import { unitIdSchema, type Rank, type UnitId } from "@workspace/game-domain"

import { buildArenaRecommendations } from "./arena-recommendations"
import type {
  ArenaCategoryId,
  ArenaGoalContribution,
  ArenaRecommendations,
  ArenaRosterCharacter,
  BuildArenaRecommendationsInput,
} from "./arena-recommendations.types"

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

const goal = (
  unit: string,
  goalId: string,
  projectId?: string
): ArenaGoalContribution => ({
  unitId: id(unit),
  goalId,
  ...(projectId ? { projectId } : {}),
})

const build = (
  over: Partial<BuildArenaRecommendationsInput>
): ArenaRecommendations =>
  buildArenaRecommendations({
    mode: "xp",
    roster: [],
    selectedProjectId: "p1",
    activeProjectContributions: [],
    activeGoalContributions: [],
    teamSize: 3,
    lockedRandomUnitIds: [],
    randomSeed: 0,
    ...over,
  })

const categoryOf = (result: ArenaRecommendations, cid: ArenaCategoryId) => {
  const found = result.categories.find((category) => category.id === cid)
  if (!found) throw new Error(`missing category ${cid}`)
  return found
}

const unitIds = (members: readonly { unitId: UnitId }[]) =>
  members.map((member) => member.unitId)

const sameSet = (a: readonly UnitId[], b: readonly UnitId[]) =>
  a.length === b.length && new Set([...a, ...b]).size === a.length

const RANKS: Rank[] = [
  "Stone1",
  "Stone2",
  "Stone3",
  "Iron1",
  "Iron2",
  "Iron3",
  "Bronze1",
  "Bronze2",
]

describe("buildArenaRecommendations", () => {
  it("returns exactly the Plan Team and the Random Team, in order", () => {
    const roster = [character("a"), character("b"), character("c")]
    const result = build({ roster })
    expect(result.categories.map((category) => category.id)).toEqual([
      "plan",
      "random",
    ])
  })

  describe("Plan Team — XP Mode", () => {
    it("ranks selected-project contributors ahead of other active-goal contributors", () => {
      const roster = ["a", "b", "c", "d", "e"].map((name) => character(name))
      const plan = categoryOf(
        build({
          roster,
          activeProjectContributions: [goal("b", "gb", "p1")],
          activeGoalContributions: [goal("b", "gb", "p1"), goal("d", "gd")],
        }),
        "plan"
      )
      expect(unitIds(plan.members)).toEqual([id("b"), id("d"), id("a")])
      expect(plan.members[0].rationale).toMatchObject({
        kind: "goal",
        goalId: "gb",
        projectId: "p1",
      })
      expect(plan.members[1].rationale).toMatchObject({
        kind: "goal",
        goalId: "gd",
      })
      expect(plan.members[1].rationale).not.toHaveProperty("projectId")
      expect(plan.members[2].rationale).toEqual({ kind: "minimum-size" })
    })

    it("does not select an XP-capped contributor while three eligible ones exist", () => {
      const roster = [
        character("a"),
        character("b"),
        character("c"),
        character("d"),
        character("e", { xpLevel: 8 }), // Common cap
      ]
      const contributions = roster.map((unit, index) =>
        goal(unit.unitId, `g${index}`, "p1")
      )
      const plan = categoryOf(
        build({
          roster,
          activeProjectContributions: contributions,
          activeGoalContributions: contributions,
        }),
        "plan"
      )
      expect(unitIds(plan.members)).not.toContain(id("e"))
      expect(plan.includedCappedCharacters).toBe(false)
      expect(plan.deliveredSize).toBe(3)
    })

    it("delivers fewer than the requested size rather than padding with capped characters", () => {
      const roster = [
        character("a"),
        character("b"),
        character("c"),
        character("d"),
        character("e", { xpLevel: 8 }),
      ]
      const contributions = roster.map((unit, index) =>
        goal(unit.unitId, `g${index}`, "p1")
      )
      const plan = categoryOf(
        build({
          roster,
          teamSize: 5,
          activeProjectContributions: contributions,
          activeGoalContributions: contributions,
        }),
        "plan"
      )
      expect(plan.deliveredSize).toBe(4)
      expect(plan.requestedSize).toBe(5)
      expect(unitIds(plan.members)).not.toContain(id("e"))
      expect(plan.includedCappedCharacters).toBe(false)
    })

    it("fills the minimum-size team with capped characters when fewer than three are eligible", () => {
      const roster = [
        character("a"),
        character("b"),
        character("c", { xpLevel: 8 }),
        character("d", { xpLevel: 8 }),
        character("e", { xpLevel: 8 }),
      ]
      const contributions = roster.map((unit, index) =>
        goal(unit.unitId, `g${index}`, "p1")
      )
      const plan = categoryOf(
        build({
          roster,
          teamSize: 5,
          activeProjectContributions: contributions,
          activeGoalContributions: contributions,
        }),
        "plan"
      )
      expect(plan.deliveredSize).toBe(3)
      expect(plan.includedCappedCharacters).toBe(true)
      expect(unitIds(plan.members).slice(0, 2)).toEqual([id("a"), id("b")])
    })

    it("carries each member's current rank and rarity", () => {
      const roster = [
        character("a", { progression: "Epic:RedOneStar", rank: "Gold1" }),
        character("b"),
        character("c"),
      ]
      const plan = categoryOf(build({ roster }), "plan")
      const byId = new Map(
        plan.members.map((member) => [member.unitId, member])
      )
      expect(byId.get(id("a"))).toMatchObject({ rank: "Gold1", rarity: "Epic" })
      expect(byId.get(id("b"))).toMatchObject({
        rank: "Stone1",
        rarity: "Common",
      })
    })
  })

  describe("Plan Team — Power Mode", () => {
    const roster = RANKS.slice(0, 6).map((rank, index) =>
      character(`u${index}`, { rank })
    )
    const contributions = roster.map((unit, index) =>
      goal(unit.unitId, `g${index}`)
    )

    it("returns the requested-size team of the strongest, in descending power", () => {
      const plan = categoryOf(
        build({
          mode: "power",
          roster,
          teamSize: 5,
          selectedProjectId: undefined,
          activeGoalContributions: contributions,
        }),
        "plan"
      )
      expect(plan.deliveredSize).toBe(5)
      expect(unitIds(plan.members)).toEqual([
        id("u5"),
        id("u4"),
        id("u3"),
        id("u2"),
        id("u1"),
      ])
    })

    it("includes an XP-capped character when its power is in range", () => {
      const cappedRoster = roster.map((unit, index) =>
        index === 5 ? character("u5", { rank: "Bronze2", xpLevel: 8 }) : unit
      )
      const plan = categoryOf(
        build({
          mode: "power",
          roster: cappedRoster,
          teamSize: 5,
          selectedProjectId: undefined,
          activeGoalContributions: contributions,
        }),
        "plan"
      )
      expect(unitIds(plan.members)).toContain(id("u5"))
    })

    it("marks a non-contributing pick as chosen for strength", () => {
      const plan = categoryOf(
        build({
          mode: "power",
          roster: roster.slice(0, 3),
          activeProjectContributions: [goal("u0", "g0", "p1")],
          activeGoalContributions: [goal("u0", "g0", "p1")],
        }),
        "plan"
      )
      const byId = new Map(
        plan.members.map((member) => [member.unitId, member.rationale])
      )
      expect(byId.get(id("u0"))).toMatchObject({ kind: "goal", goalId: "g0" })
      expect(byId.get(id("u2"))).toMatchObject({ kind: "strength" })
    })
  })

  describe("Plan Team — always builds", () => {
    it("widens to a full-roster team, flagged broadened, with no project or goals", () => {
      const roster = ["a", "b", "c", "d"].map((name) => character(name))
      const plan = categoryOf(
        build({
          roster,
          selectedProjectId: undefined,
          activeProjectContributions: [],
          activeGoalContributions: [],
        }),
        "plan"
      )
      expect(plan.broadened).toBe(true)
      expect(plan.poolUsed).toBe("full-roster")
      expect(plan.deliveredSize).toBe(3)
    })

    it("broadens a thin selected project beyond its own contributors", () => {
      const roster = ["a", "b", "c", "d", "e"].map((name) => character(name))
      const projectContributions = [
        goal("a", "g1", "p1"),
        goal("b", "g2", "p1"),
      ]
      const plan = categoryOf(
        build({
          roster,
          activeProjectContributions: projectContributions,
          activeGoalContributions: [
            ...projectContributions,
            goal("c", "g3"),
            goal("d", "g4"),
          ],
        }),
        "plan"
      )
      expect(plan.broadened).toBe(true)
      expect(plan.poolUsed).toBe("overall-goals")
    })
  })

  describe("Random Team", () => {
    const bigRoster = Array.from({ length: 8 }, (_, index) =>
      character(`u${index}`)
    )

    it("draws the requested size and reshuffles on regenerate", () => {
      const first = unitIds(
        categoryOf(
          build({ roster: bigRoster, teamSize: 5, randomSeed: 1 }),
          "random"
        ).members
      )
      const second = unitIds(
        categoryOf(
          build({ roster: bigRoster, teamSize: 5, randomSeed: 2 }),
          "random"
        ).members
      )
      expect(first).toHaveLength(5)
      expect(second).toHaveLength(5)
      expect(sameSet(first, second)).toBe(false)
    })

    it("excludes XP-capped characters in XP Mode when enough are eligible", () => {
      const roster = [
        ...Array.from({ length: 5 }, (_, i) => character(`e${i}`)),
        ...Array.from({ length: 3 }, (_, i) =>
          character(`c${i}`, { xpLevel: 8 })
        ),
      ]
      for (let seed = 0; seed < 6; seed++) {
        const team = unitIds(
          categoryOf(
            build({ roster, mode: "xp", teamSize: 5, randomSeed: seed }),
            "random"
          ).members
        )
        expect(team.every((unit) => String(unit).startsWith("e"))).toBe(true)
      }
    })

    it("falls back to the full roster when too few eligible for the requested size", () => {
      const roster = [
        character("e0"),
        ...Array.from({ length: 4 }, (_, i) =>
          character(`c${i}`, { xpLevel: 8 })
        ),
      ]
      const team = categoryOf(
        build({ roster, mode: "xp", teamSize: 5, randomSeed: 2 }),
        "random"
      )
      expect(team.members).toHaveLength(5)
    })

    it("favors stronger characters in Power Mode across many regenerations", () => {
      const roster = [
        character("strongA", { rank: "Bronze2" }),
        character("strongB", { rank: "Bronze1" }),
        character("weakA"),
        character("weakB"),
        character("weakC"),
        character("weakD"),
      ]
      let strong = 0
      let weak = 0
      for (let seed = 0; seed < 60; seed++) {
        const team = unitIds(
          categoryOf(
            build({ roster, mode: "power", teamSize: 3, randomSeed: seed }),
            "random"
          ).members
        )
        strong += team.filter((u) => String(u).startsWith("strong")).length
        weak += team.filter((u) => String(u).startsWith("weak")).length
      }
      // Two strong vs four weak, weighted by power: a strong slot should be drawn
      // disproportionately often relative to its 2-of-6 population share.
      expect(strong).toBeGreaterThan(0)
      expect(strong / (strong + weak)).toBeGreaterThan(2 / 6)
    })

    it("keeps locked characters across every regenerate, pinned first", () => {
      for (let seed = 0; seed < 6; seed++) {
        const team = categoryOf(
          build({
            roster: bigRoster,
            teamSize: 5,
            lockedRandomUnitIds: [id("u0"), id("u3")],
            randomSeed: seed,
          }),
          "random"
        )
        expect(unitIds(team.members).slice(0, 2)).toEqual([id("u0"), id("u3")])
        expect(team.members[0].locked).toBe(true)
        expect(team.members[1].locked).toBe(true)
        expect(team.members[2].locked).toBe(false)
      }
    })

    it("is a no-op when every slot is locked", () => {
      const locked = [id("u0"), id("u1"), id("u2"), id("u3"), id("u4")]
      const at = (seed: number) =>
        unitIds(
          categoryOf(
            build({
              roster: bigRoster,
              teamSize: 5,
              lockedRandomUnitIds: locked,
              randomSeed: seed,
            }),
            "random"
          ).members
        )
      expect(at(0)).toEqual(locked)
      expect(at(3)).toEqual(locked)
    })

    it("keeps a locked XP-capped character even though the XP-Mode pool would drop it", () => {
      const roster = [
        character("cap", { xpLevel: 8 }),
        ...Array.from({ length: 5 }, (_, i) => character(`e${i}`)),
      ]
      const team = unitIds(
        categoryOf(
          build({
            roster,
            mode: "xp",
            teamSize: 3,
            lockedRandomUnitIds: [id("cap")],
            randomSeed: 1,
          }),
          "random"
        ).members
      )
      expect(team).toContain(id("cap"))
      expect(team).toHaveLength(3)
    })

    it("keeps consecutive regenerations distinct on a small roster with sample collisions", () => {
      const roster = Array.from({ length: 6 }, (_, index) =>
        character(`u${index}`)
      )
      const teams = Array.from({ length: 12 }, (_, seed) =>
        unitIds(
          categoryOf(build({ roster, teamSize: 5, randomSeed: seed }), "random")
            .members
        )
      )
      for (let seed = 1; seed < teams.length; seed++) {
        expect(
          sameSet(teams[seed - 1], teams[seed]),
          `seed ${seed} matched seed ${seed - 1}`
        ).toBe(false)
      }
      expect(
        unitIds(
          categoryOf(build({ roster, teamSize: 5, randomSeed: 3 }), "random")
            .members
        )
      ).toEqual(teams[3])
    })

    it("uses the whole roster when it is smaller than the requested size", () => {
      const random = categoryOf(
        build({
          roster: [character("a"), character("b"), character("c")],
          teamSize: 5,
          randomSeed: 5,
        }),
        "random"
      )
      expect(random.members).toHaveLength(3)
      expect(random.includedCappedCharacters).toBe(false)
    })
  })
})

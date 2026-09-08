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
    hasActiveProject: true,
    activeProjectContributions: [],
    activeGoalContributions: [],
    randomSeed: 1,
    ...over,
  })

const categoryOf = (result: ArenaRecommendations, cid: ArenaCategoryId) => {
  const found = result.categories.find((category) => category.id === cid)
  if (!found) throw new Error(`missing category ${cid}`)
  return found
}

const unitIds = (members: readonly { unitId: UnitId }[]) =>
  members.map((member) => member.unitId)

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
  it("returns the three supported categories, in order, and never an HSE category", () => {
    const roster = [character("a"), character("b"), character("c")]
    const result = build({ roster })
    expect(result.categories.map((category) => category.id)).toEqual([
      "active-project",
      "overall-goals",
      "random",
    ])
  })

  describe("XP Mode", () => {
    it("does not select an XP-capped contributor while three eligible ones exist", () => {
      const roster = [
        character("a", { rank: "Iron1" }),
        character("b", { rank: "Iron2" }),
        character("c", { rank: "Iron3" }),
        character("d", { rank: "Bronze1" }),
        character("e", { rank: "Bronze2", xpLevel: 8 }), // capped, highest power
      ]
      const contributions = roster.map((unit, index) =>
        goal(unit.unitId, `g${index}`, "p1")
      )
      const ap = categoryOf(
        build({
          roster,
          activeProjectContributions: contributions,
          activeGoalContributions: contributions,
        }),
        "active-project"
      )
      expect(ap.variants.map((variant) => variant.size)).toEqual([3, 4])
      expect(ap.includedCappedCharacters).toBe(false)
      for (const variant of ap.variants) {
        expect(unitIds(variant.members)).not.toContain(id("e"))
      }
      expect(ap.variants.find((variant) => variant.isPrimary)?.size).toBe(3)
    })

    it("offers 3/4/5 variants with the three-character team primary when enough eligible", () => {
      const roster = RANKS.slice(0, 6).map((rank, index) =>
        character(`u${index}`, { rank })
      )
      const contributions = roster.map((unit, index) =>
        goal(unit.unitId, `g${index}`, "p1")
      )
      const ap = categoryOf(
        build({
          roster,
          activeProjectContributions: contributions,
          activeGoalContributions: contributions,
        }),
        "active-project"
      )
      expect(ap.variants.map((variant) => variant.size)).toEqual([3, 4, 5])
      expect(ap.variants.filter((variant) => variant.isPrimary)).toHaveLength(1)
      expect(ap.variants.find((variant) => variant.isPrimary)?.size).toBe(3)
      expect(ap.includedCappedCharacters).toBe(false)
    })

    it("fills the minimum-size team with capped characters when fewer than three are eligible", () => {
      const roster = [
        character("a", { rank: "Iron1" }),
        character("b", { rank: "Iron2" }),
        character("c", { rank: "Iron3", xpLevel: 8 }),
        character("d", { rank: "Bronze1", xpLevel: 8 }),
        character("e", { rank: "Bronze2", xpLevel: 8 }),
      ]
      const contributions = roster.map((unit, index) =>
        goal(unit.unitId, `g${index}`, "p1")
      )
      const ap = categoryOf(
        build({
          roster,
          activeProjectContributions: contributions,
          activeGoalContributions: contributions,
        }),
        "active-project"
      )
      expect(ap.variants.map((variant) => variant.size)).toEqual([3])
      expect(ap.variants[0].members).toHaveLength(3)
      expect(ap.includedCappedCharacters).toBe(true)
    })
  })

  describe("Power Mode", () => {
    const roster = RANKS.slice(0, 6).map((rank, index) =>
      character(`u${index}`, { rank })
    )
    const contributions = roster.map((unit, index) =>
      goal(unit.unitId, `g${index}`)
    )

    it("returns a single five-character team of the strongest, in descending power", () => {
      const og = categoryOf(
        build({
          mode: "power",
          roster,
          hasActiveProject: false,
          activeGoalContributions: contributions,
        }),
        "overall-goals"
      )
      expect(og.variants).toHaveLength(1)
      expect(og.variants[0].size).toBe(5)
      // u5 (Iron3) strongest … u1 (Stone2) weakest of the top five; u0 (Stone1) dropped.
      expect(unitIds(og.variants[0].members)).toEqual([
        id("u5"),
        id("u4"),
        id("u3"),
        id("u2"),
        id("u1"),
      ])
    })

    it("includes an XP-capped character when its power is in the top five", () => {
      const cappedRoster = roster.map((unit, index) =>
        index === 5 ? character("u5", { rank: "Iron3", xpLevel: 8 }) : unit
      )
      const og = categoryOf(
        build({
          mode: "power",
          roster: cappedRoster,
          hasActiveProject: false,
          activeGoalContributions: contributions,
        }),
        "overall-goals"
      )
      expect(unitIds(og.variants[0].members)).toContain(id("u5"))
    })
  })

  describe("empty and broadened states", () => {
    it("marks the active-project category empty when there is no active plan", () => {
      const roster = [character("a"), character("b"), character("c")]
      const ap = categoryOf(
        build({
          roster,
          hasActiveProject: false,
          activeGoalContributions: [goal("a", "g1")],
        }),
        "active-project"
      )
      expect(ap.emptyReason).toBe("no-active-project")
      expect(ap.variants).toEqual([])
    })

    it("marks the overall-goals category empty when no owned character has an active goal", () => {
      const roster = [
        character("a"),
        character("b"),
        character("c"),
        character("d"),
      ]
      const result = build({ roster, hasActiveProject: true })
      expect(categoryOf(result, "overall-goals").emptyReason).toBe(
        "no-active-goals"
      )
      // The active-project category still builds — it widens to the full roster.
      const ap = categoryOf(result, "active-project")
      expect(ap.emptyReason).toBeUndefined()
      expect(ap.broadened).toBe(true)
      expect(ap.poolUsed).toBe("full-roster")
    })

    it("broadens a thin active project beyond its own contributors", () => {
      const roster = ["a", "b", "c", "d", "e"].map((name) => character(name))
      const projectContributions = [
        goal("a", "g1", "p1"),
        goal("b", "g2", "p1"),
      ]
      const ap = categoryOf(
        build({
          roster,
          activeProjectContributions: projectContributions,
          activeGoalContributions: [
            ...projectContributions,
            goal("c", "g3"),
            goal("d", "g4"),
          ],
        }),
        "active-project"
      )
      expect(ap.broadened).toBe(true)
      expect(ap.poolUsed).toBe("overall-goals")
    })
  })

  describe("random category", () => {
    it("draws five from a large roster and reshuffles to a different team on regenerate", () => {
      const roster = Array.from({ length: 8 }, (_, index) =>
        character(`u${index}`)
      )
      // randomSeed increments by one per regenerate; a build guarantees its team differs from the
      // one the previous seed produced.
      const first = unitIds(
        categoryOf(build({ roster, randomSeed: 1 }), "random").variants[0]
          .members
      )
      const second = unitIds(
        categoryOf(build({ roster, randomSeed: 2 }), "random").variants[0]
          .members
      )
      expect(first).toHaveLength(5)
      expect(second).toHaveLength(5)
      const identical =
        first.length === second.length &&
        new Set([...first, ...second]).size === first.length
      expect(identical).toBe(false)
    })

    it("uses the whole roster when it is smaller than a full team", () => {
      const random = categoryOf(
        build({
          roster: [character("a"), character("b"), character("c")],
          randomSeed: 5,
        }),
        "random"
      )
      expect(random.variants[0].size).toBe(3)
      expect(random.includedCappedCharacters).toBe(false)
    })

    it("is unaffected by the selected mode", () => {
      const roster = Array.from({ length: 6 }, (_, index) =>
        character(`u${index}`)
      )
      const xp = unitIds(
        categoryOf(build({ roster, mode: "xp", randomSeed: 3 }), "random")
          .variants[0].members
      )
      const power = unitIds(
        categoryOf(build({ roster, mode: "power", randomSeed: 3 }), "random")
          .variants[0].members
      )
      expect(power).toEqual(xp)
    })
  })

  describe("member rationale", () => {
    const roster = [character("a"), character("b"), character("c")]
    const contributions = [goal("a", "g1", "p1"), goal("b", "g2", "p1")]

    it("references the goal for a contributor and marks a filler as minimum-size (XP Mode)", () => {
      const ap = categoryOf(
        build({
          roster,
          activeProjectContributions: contributions,
          activeGoalContributions: contributions,
        }),
        "active-project"
      )
      const byId = new Map(
        ap.variants[0].members.map((member) => [
          member.unitId,
          member.rationale,
        ])
      )
      expect(byId.get(id("a"))).toMatchObject({
        kind: "goal",
        goalId: "g1",
        projectId: "p1",
      })
      expect(byId.get(id("c"))).toEqual({ kind: "minimum-size" })
    })

    it("marks a non-contributing pick as chosen for strength (Power Mode)", () => {
      const pm = categoryOf(
        build({
          mode: "power",
          roster,
          activeProjectContributions: contributions,
          activeGoalContributions: contributions,
        }),
        "active-project"
      )
      const byId = new Map(
        pm.variants[0].members.map((member) => [
          member.unitId,
          member.rationale,
        ])
      )
      expect(byId.get(id("c"))).toMatchObject({ kind: "strength" })
      expect(byId.get(id("a"))).toMatchObject({ kind: "goal", goalId: "g1" })
    })
  })
})

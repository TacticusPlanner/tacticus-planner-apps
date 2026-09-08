import { describe, expect, it } from "vitest"

import {
  unitIdSchema,
  type Alliance,
  type UnitId,
} from "@workspace/game-domain"

import { buildSalvageRecommendations } from "./salvage-recommendations"
import type {
  BuildSalvageRecommendationsInput,
  SalvageRecommendations,
  SalvageRosterCatalog,
  SalvageTrack,
} from "./salvage-recommendations.types"
import type { ArenaGoalContribution } from "./arena-recommendations.types"

const id = (value: string): UnitId => unitIdSchema.parse(value)

const character = (value: string) => ({
  unitId: id(value),
  rank: "Stone1" as const,
  progression: "Common:None" as const,
  xpLevel: 3,
  appliedUpgradeCount: 0,
  activeAbilityLevel: 1,
  passiveAbilityLevel: 1,
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

/** Builds the catalog map the track filter reads: `alliance` per id, plus optional `traits`. */
const catalog = (
  entries: Record<string, { alliance: Alliance; traits?: string[] }>
): SalvageRosterCatalog =>
  new Map(
    Object.entries(entries).map(([unit, entry]) => [
      id(unit),
      {
        alliance: entry.alliance,
        traits: entry.traits ?? [],
        damageTypes: [],
      },
    ])
  )

const build = (
  over: Partial<BuildSalvageRecommendationsInput> & {
    rosterCatalog: SalvageRosterCatalog
  }
): SalvageRecommendations =>
  buildSalvageRecommendations({
    mode: "xp",
    track: "Imperial",
    roster: [],
    selectedProjectId: "p1",
    activeProjectContributions: [],
    activeGoalContributions: [],
    teamSize: 5,
    lockedRandomUnitIds: [],
    randomSeed: 0,
    ...over,
  })

const planOf = (result: SalvageRecommendations) => {
  const found = result.categories.find((category) => category.id === "plan")
  if (!found) throw new Error("missing plan category")
  return found
}
const randomOf = (result: SalvageRecommendations) => {
  const found = result.categories.find((category) => category.id === "random")
  if (!found) throw new Error("missing random category")
  return found
}
const ids = (members: readonly { unitId: UnitId }[]) =>
  members.map((member) => String(member.unitId))

describe("buildSalvageRecommendations", () => {
  it("never puts an off-alliance goal contributor in a team", () => {
    const roster = ["imp1", "imp2", "imp3", "cha1"].map(character)
    const result = build({
      track: "Imperial",
      roster,
      rosterCatalog: catalog({
        imp1: { alliance: "Imperial" },
        imp2: { alliance: "Imperial" },
        imp3: { alliance: "Imperial" },
        cha1: { alliance: "Chaos" },
      }),
      activeProjectContributions: [goal("cha1", "g-cha", "p1")],
      activeGoalContributions: [goal("cha1", "g-cha", "p1")],
    })

    for (const category of result.categories) {
      expect(ids(category.members)).not.toContain("cha1")
    }
  })

  it("widens only within the track's alliance", () => {
    const roster = ["imp1", "imp2", "imp3", "imp4", "imp5", "xen1", "xen2"].map(
      character
    )
    const plan = planOf(
      build({
        track: "Imperial",
        roster,
        rosterCatalog: catalog({
          imp1: { alliance: "Imperial" },
          imp2: { alliance: "Imperial" },
          imp3: { alliance: "Imperial" },
          imp4: { alliance: "Imperial" },
          imp5: { alliance: "Imperial" },
          xen1: { alliance: "Xenos" },
          xen2: { alliance: "Xenos" },
        }),
        // Only two owned Imperial goal contributors — the pool must widen to imp3..imp5, not Xenos.
        activeProjectContributions: [goal("imp1", "g1", "p1")],
        activeGoalContributions: [goal("imp1", "g1", "p1"), goal("imp2", "g2")],
      })
    )
    expect(plan.broadened).toBe(true)
    expect(plan.deliveredSize).toBe(5)
    for (const member of ids(plan.members)) {
      expect(member.startsWith("imp")).toBe(true)
    }
  })

  it("ignores a preference that only off-alliance characters satisfy", () => {
    const roster = ["imp1", "imp2", "imp3", "cha1"].map(character)
    const result = build({
      track: "Imperial",
      roster,
      teamSize: 3,
      rosterCatalog: catalog({
        imp1: { alliance: "Imperial" },
        imp2: { alliance: "Imperial" },
        imp3: { alliance: "Imperial" },
        cha1: { alliance: "Chaos", traits: ["Flying"] },
      }),
      preferences: { trait: "Flying" },
    })

    for (const category of result.categories) {
      expect(category.members).toHaveLength(3)
      expect(ids(category.members)).not.toContain("cha1")
    }
  })

  it("restricts the teams to a preference the track's own characters satisfy", () => {
    const roster = ["imp1", "imp2", "imp3", "imp4", "imp5"].map(character)
    const result = build({
      track: "Imperial",
      roster,
      teamSize: 3,
      rosterCatalog: catalog({
        imp1: { alliance: "Imperial", traits: ["Flying"] },
        imp2: { alliance: "Imperial", traits: ["Flying"] },
        imp3: { alliance: "Imperial", traits: ["Flying"] },
        imp4: { alliance: "Imperial" },
        imp5: { alliance: "Imperial" },
      }),
      preferences: { trait: "Flying" },
    })

    const flyers = new Set(["imp1", "imp2", "imp3"])
    for (const category of result.categories) {
      for (const member of ids(category.members)) {
        expect(flyers.has(member)).toBe(true)
      }
    }
  })

  it("re-teams entirely when the track changes", () => {
    const roster = ["imp1", "imp2", "imp3", "cha1", "cha2", "cha3"].map(
      character
    )
    const rosterCatalog = catalog({
      imp1: { alliance: "Imperial" },
      imp2: { alliance: "Imperial" },
      imp3: { alliance: "Imperial" },
      cha1: { alliance: "Chaos" },
      cha2: { alliance: "Chaos" },
      cha3: { alliance: "Chaos" },
    })
    const imperial = randomOf(
      build({ track: "Imperial", roster, rosterCatalog })
    )
    const chaos = randomOf(build({ track: "Chaos", roster, rosterCatalog }))

    for (const member of ids(imperial.members)) {
      expect(member.startsWith("imp")).toBe(true)
    }
    for (const member of ids(chaos.members)) {
      expect(member.startsWith("cha")).toBe(true)
    }
  })

  it("still ranks selected-project contributors ahead of other-goal contributors within the alliance", () => {
    const roster = ["a", "b", "c", "d", "e"].map(character)
    const track: SalvageTrack = "Xenos"
    const plan = planOf(
      build({
        track,
        roster,
        teamSize: 3,
        rosterCatalog: catalog({
          a: { alliance: "Xenos" },
          b: { alliance: "Xenos" },
          c: { alliance: "Xenos" },
          d: { alliance: "Xenos" },
          e: { alliance: "Xenos" },
        }),
        activeProjectContributions: [goal("b", "gb", "p1")],
        activeGoalContributions: [goal("b", "gb", "p1"), goal("d", "gd")],
      })
    )
    expect(ids(plan.members)).toEqual(["b", "d", "a"])
    expect(plan.members[0].rationale).toMatchObject({
      kind: "goal",
      goalId: "gb",
      projectId: "p1",
    })
  })
})

import { describe, expect, it } from "vitest"

import {
  unitIdSchema,
  type Alliance,
  type Rank,
  type UnitId,
} from "@workspace/game-domain"

import { buildOnslaughtRecommendations } from "./onslaught-recommendations"
import type {
  BuildOnslaughtRecommendationsInput,
  OnslaughtRecommendations,
} from "./onslaught-recommendations.types"
import type { SalvageRosterCatalog } from "./salvage-recommendations.types"
import type { ArenaGoalContribution } from "./arena-recommendations.types"

const id = (value: string): UnitId => unitIdSchema.parse(value)

const character = (
  value: string,
  over: { rank?: Rank; xpLevel?: number } = {}
) => ({
  unitId: id(value),
  rank: over.rank ?? ("Stone1" as Rank),
  progression: "Common:None" as const,
  xpLevel: over.xpLevel ?? 3,
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

const catalog = (entries: Record<string, Alliance>): SalvageRosterCatalog =>
  new Map(
    Object.entries(entries).map(([unit, alliance]) => [
      id(unit),
      { alliance, traits: [], damageTypes: [] },
    ])
  )

const build = (
  over: Partial<BuildOnslaughtRecommendationsInput> & {
    rosterCatalog: SalvageRosterCatalog
  }
): OnslaughtRecommendations =>
  buildOnslaughtRecommendations({
    mode: "xp",
    track: "Imperial",
    roster: [],
    selectedProjectId: "p1",
    activeProjectContributions: [],
    activeGoalContributions: [],
    onslaughtAscensionGoals: [],
    teamSize: 5,
    lockedRandomUnitIds: [],
    randomSeed: 0,
    ...over,
  })

const planOf = (result: OnslaughtRecommendations) =>
  result.categories.find((category) => category.id === "plan")!
const ids = (members: readonly { unitId: UnitId }[]) =>
  members.map((member) => String(member.unitId))

describe("buildOnslaughtRecommendations", () => {
  it("leads the XP-Mode Plan Team with an Onslaught Ascend goal character", () => {
    const roster = ["imp1", "imp2", "imp3", "imp4"].map((v) => character(v))
    const plan = planOf(
      build({
        track: "Imperial",
        roster,
        teamSize: 3,
        rosterCatalog: catalog({
          imp1: "Imperial",
          imp2: "Imperial",
          imp3: "Imperial",
          imp4: "Imperial",
        }),
        activeProjectContributions: [goal("imp1", "g1", "p1")],
        activeGoalContributions: [goal("imp2", "g2")],
        onslaughtAscensionGoals: [
          { unitId: id("imp4"), goalId: "og-4", projectId: "p1" },
        ],
      })
    )
    expect(ids(plan.members)[0]).toBe("imp4")
    expect(plan.members[0].rationale).toEqual({
      kind: "onslaught-goal",
      goalId: "og-4",
      projectId: "p1",
    })
  })

  it("never puts an Onslaught goal unit that is not in the character roster into a team", () => {
    // Models a Machine-of-War Onslaught goal: the hook never passes MoWs, and a unit absent from the
    // track roster is dropped by the builder anyway.
    const roster = ["imp1", "imp2", "imp3"].map((v) => character(v))
    const result = build({
      track: "Imperial",
      roster,
      teamSize: 3,
      rosterCatalog: catalog({
        imp1: "Imperial",
        imp2: "Imperial",
        imp3: "Imperial",
      }),
      onslaughtAscensionGoals: [{ unitId: id("mowRax"), goalId: "og-mow" }],
    })
    for (const category of result.categories) {
      expect(ids(category.members)).not.toContain("mowRax")
    }
  })

  it("never leads with an off-alliance Onslaught goal character", () => {
    const roster = ["imp1", "imp2", "imp3", "cha1"].map((v) => character(v))
    const plan = planOf(
      build({
        track: "Imperial",
        roster,
        teamSize: 3,
        rosterCatalog: catalog({
          imp1: "Imperial",
          imp2: "Imperial",
          imp3: "Imperial",
          cha1: "Chaos",
        }),
        onslaughtAscensionGoals: [{ unitId: id("cha1"), goalId: "og-cha" }],
      })
    )
    expect(ids(plan.members)).not.toContain("cha1")
    expect(ids(plan.members)).toHaveLength(3)
  })

  it("widens through the lower pools like any other priority pool", () => {
    const roster = ["imp1", "imp2", "imp3", "imp4", "imp5"].map((v) =>
      character(v)
    )
    const plan = planOf(
      build({
        track: "Imperial",
        roster,
        teamSize: 5,
        rosterCatalog: catalog({
          imp1: "Imperial",
          imp2: "Imperial",
          imp3: "Imperial",
          imp4: "Imperial",
          imp5: "Imperial",
        }),
        onslaughtAscensionGoals: [{ unitId: id("imp1"), goalId: "og-1" }],
      })
    )
    expect(plan.deliveredSize).toBe(5)
    expect(plan.broadened).toBe(true)
    expect(ids(plan.members)[0]).toBe("imp1")
  })

  it("ranks the Plan Team by combat power in Power Mode — a weak Onslaught goal character does not lead", () => {
    const roster = [
      character("weak", { rank: "Stone1", xpLevel: 1 }),
      character("strongA", { rank: "Bronze2" as Rank, xpLevel: 30 }),
      character("strongB", { rank: "Bronze1" as Rank, xpLevel: 25 }),
      character("strongC", { rank: "Iron3" as Rank, xpLevel: 20 }),
    ]
    const plan = planOf(
      build({
        mode: "power",
        track: "Imperial",
        roster,
        teamSize: 3,
        rosterCatalog: catalog({
          weak: "Imperial",
          strongA: "Imperial",
          strongB: "Imperial",
          strongC: "Imperial",
        }),
        onslaughtAscensionGoals: [{ unitId: id("weak"), goalId: "og-weak" }],
      })
    )
    expect(ids(plan.members)[0]).not.toBe("weak")
  })
})

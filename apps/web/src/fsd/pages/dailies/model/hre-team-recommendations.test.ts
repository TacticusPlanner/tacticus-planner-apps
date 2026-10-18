import { describe, expect, it } from "vitest"
import type { UnitId } from "@workspace/game-domain"

import {
  hseTeamsFixtureCharacters,
  hseTeamsFixtureRead,
} from "@/test/fixtures/hse-teams"

import {
  buildHreTeam,
  type BuildHreTeamInput,
  type HreTeam,
} from "./hre-team-recommendations"
import { anyUnitPowerFixture } from "./team-power.fixtures"

type Characters = Parameters<typeof hseTeamsFixtureRead>[0]

function build(
  overrides: Partial<BuildHreTeamInput> & { characters?: Characters } = {}
): HreTeam | null {
  const read = hseTeamsFixtureRead(overrides.characters)
  if (read.status !== "ready") throw new Error("fixture read")
  return buildHreTeam({
    rule: "alliance",
    alliance: "Xenos",
    featuredCharacterId: "orksWeirdboy",
    roster: read.roster,
    catalog: read.catalog,
    summoners: new Set<UnitId>(),
    unitPower: anyUnitPowerFixture(),
    ...overrides,
  })
}

const ids = (team: HreTeam | null) =>
  team?.status === "ready" ? team.team.members.map((m) => m.unitId) : []

const xenos = (
  unitId: string,
  rank: "Gold1" | "Silver1" | "Bronze1" | "Stone1"
) => ({
  unitId,
  rank,
  alliance: "Xenos" as const,
  faction: "Orks",
  traits: [],
})

describe("buildHreTeam", () => {
  it("fields only the alliance's units, strongest five", () => {
    const characters = [
      ...hseTeamsFixtureCharacters,
      xenos("orksWarboss", "Gold1"),
      xenos("orksBigMek", "Silver1"),
      xenos("orksRuntherd", "Bronze1"),
      xenos("orksKillaKan", "Stone1"),
      xenos("orksNob", "Stone1"),
    ]
    const team = build({ characters })
    expect(team?.status).toBe("ready")
    expect(ids(team)).toHaveLength(5)
    expect(ids(team)).toContain("necroSpyder")
    expect(ids(team)).not.toContain("orksKillaKan")
    expect(ids(team)).not.toContain("orksNob")
    expect(ids(team).some((id) => id === "ultraCalgar")).toBe(false)
  })

  it("keeps a short alliance team short instead of filling it", () => {
    const characters = [
      ...hseTeamsFixtureCharacters,
      xenos("orksWarboss", "Gold1"),
    ]
    const team = build({ characters })
    expect(team).toMatchObject({ status: "ready", eligibleCount: 3 })
    expect(ids(team)).toHaveLength(3)
  })

  it("reports too few units below the minimum team size", () => {
    expect(build()).toEqual({
      status: "insufficient",
      rule: "alliance",
      eligibleCount: 2,
    })
  })

  it("has no alliance team without a resolved alliance", () => {
    expect(build({ alliance: null })).toBeNull()
  })

  it("leaves summoners out of a summon-free team", () => {
    const team = build({
      rule: "summonFree",
      summoners: new Set(["ultraCalgar", "thousAhriman"] as UnitId[]),
    })
    expect(ids(team)).toHaveLength(5)
    expect(ids(team)).not.toContain("ultraCalgar")
    expect(ids(team)).not.toContain("thousAhriman")
  })

  it("leads with the featured hero once unlocked", () => {
    const team = build({ rule: "featured", featuredCharacterId: "necroSpyder" })
    expect(ids(team)[0]).toBe("necroSpyder")
    expect(ids(team)).toHaveLength(5)
  })

  it("asks to unlock a locked featured hero first", () => {
    expect(build({ rule: "featured" })).toEqual({ status: "locked-hero" })
  })
})

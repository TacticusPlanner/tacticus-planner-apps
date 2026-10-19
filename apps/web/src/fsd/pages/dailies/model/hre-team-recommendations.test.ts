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

type Overrides = Partial<Omit<BuildHreTeamInput, "plan">> & {
  characters?: Characters
  plan?: Partial<BuildHreTeamInput["plan"]>
  /** Ranged damage type per unit id (the fixture catalog has none). */
  ranged?: Record<string, string>
}

function build(overrides: Overrides = {}): HreTeam | null {
  const { characters, plan, ranged = {}, ...rest } = overrides
  const read = hseTeamsFixtureRead(characters)
  if (read.status !== "ready") throw new Error("fixture read")
  const catalog = new Map(
    [...read.catalog].map(([id, view]) => [
      id,
      { ...view, meleeDamage: "Power", rangedDamage: ranged[id] ?? null },
    ])
  )
  return buildHreTeam({
    plan: {
      rule: "alliance",
      mode: "battle",
      size: 5,
      support: false,
      preferPsychic: false,
      ...plan,
    },
    alliance: "Xenos",
    featuredCharacterId: "orksWeirdboy",
    roster: read.roster,
    catalog,
    summoners: new Set<UnitId>(),
    unitPower: anyUnitPowerFixture(),
    ...rest,
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
      plan: { rule: "summonFree" },
      summoners: new Set(["ultraCalgar", "thousAhriman"] as UnitId[]),
    })
    expect(ids(team)).toHaveLength(5)
    expect(ids(team)).not.toContain("ultraCalgar")
    expect(ids(team)).not.toContain("thousAhriman")
  })

  it("leads with the featured hero once unlocked", () => {
    const team = build({
      plan: { rule: "featured" },
      featuredCharacterId: "necroSpyder",
    })
    expect(ids(team)[0]).toBe("necroSpyder")
    expect(ids(team)).toHaveLength(5)
  })

  it("asks to unlock a locked featured hero first", () => {
    expect(build({ plan: { rule: "featured" } })).toEqual({
      status: "locked-hero",
    })
  })

  it("fields an Onslaught pool of the alliance with the most ranged units", () => {
    const team = build({
      plan: { rule: "ranged", mode: "onslaught", size: 8 },
      ranged: {
        thousAhriman: "Bolter",
        thousInfernalMaster: "Psychic",
        thousSorcerer: "Psychic",
        deathTyphus: "Bolter",
        ultraCalgar: "Bolter",
        ultraTigurius: "Psychic",
        eldarFarseer: "Psychic",
      },
    })
    expect(team).toMatchObject({
      status: "ready",
      alliance: "Chaos",
      eligibleCount: 4,
    })
    expect(ids(team)).toEqual([
      "thousAhriman",
      "thousInfernalMaster",
      "thousSorcerer",
      "deathTyphus",
    ])
  })

  it("breaks a ranged tie toward the featured alliance and leads with Psychic damage", () => {
    const team = build({
      characters: [...hseTeamsFixtureCharacters, xenos("orksWarboss", "Gold1")],
      plan: { rule: "ranged", mode: "onslaught", size: 8, preferPsychic: true },
      ranged: {
        ultraCalgar: "Bolter",
        darkaAzrael: "Bolter",
        bloodMephiston: "Bolter",
        necroSpyder: "Bolter",
        orksWarboss: "Bolter",
        eldarFarseer: "Psychic",
      },
    })
    expect(team).toMatchObject({ status: "ready", alliance: "Xenos" })
    expect(ids(team)[0]).toBe("eldarFarseer")
    expect(ids(team)).toHaveLength(3)
  })

  it("fields one Healer or Mechanic while the heal objective is open", () => {
    const characters = hseTeamsFixtureCharacters.map((character) =>
      character.unitId === "blackPossession"
        ? { ...character, traits: ["Healer"] }
        : character
    )
    const team = build({
      characters,
      plan: { rule: "summonFree", mode: "arena", support: true },
    })
    expect(team).toMatchObject({ status: "ready", support: "included" })
    expect(ids(team)[0]).toBe("blackPossession")
    expect(ids(team)).toHaveLength(5)
    expect(
      build({ plan: { rule: "summonFree", mode: "arena", support: true } })
    ).toMatchObject({ support: "missing" })
  })
})

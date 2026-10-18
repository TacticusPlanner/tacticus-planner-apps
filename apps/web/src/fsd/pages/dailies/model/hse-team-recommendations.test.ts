import { describe, expect, it } from "vitest"

import {
  hseVariant,
  type HseFixtureId,
} from "@/test/fixtures/home-screen-event-scoring"
import {
  hseTeamsFixtureCharacters,
  hseTeamsFixtureRead,
} from "@/test/fixtures/hse-teams"

import { mapRosterCharacter } from "./arena-recommendations"
import { buildHseTeamRecommendations } from "./hse-team-recommendations"
import type {
  HseModeTeams,
  HseTeam,
  HseTeamCatalog,
  HseTeamMode,
  HseTeamRecommendations,
} from "./hse-team-recommendations.types"

type Characters = Parameters<typeof hseTeamsFixtureRead>[0]

function build(
  definitionId: HseFixtureId,
  options: { variantKey?: string; characters?: Characters } = {}
): HseTeamRecommendations {
  const read = hseTeamsFixtureRead(options.characters)
  if (read.status !== "ready") throw new Error("fixture read")
  return buildHseTeamRecommendations({
    trackers: hseVariant(definitionId, options.variantKey).trackers,
    roster: read.roster.map(mapRosterCharacter),
    catalog: read.catalog as unknown as HseTeamCatalog,
  })
}

const modeOf = (result: HseTeamRecommendations, mode: HseTeamMode) => {
  const found = result.modes.find((entry) => entry.mode === mode)
  if (!found) throw new Error(`no ${mode} teams`)
  return found
}

const teamOf = (modeTeams: HseModeTeams, alliance: string | null) => {
  const found = modeTeams.teams.find((team) => team.alliance === alliance)
  if (!found) throw new Error(`no ${alliance} team`)
  return found
}

const ready = (team: HseTeam) => {
  if (team.status !== "ready") throw new Error("team not ready")
  return team
}

const ids = (team: HseTeam) => ready(team).team.members.map((m) => m.unitId)

const extra = (
  unitId: string,
  rank: (typeof hseTeamsFixtureCharacters)[number]["rank"],
  alliance: (typeof hseTeamsFixtureCharacters)[number]["alliance"],
  faction: string,
  traits: string[] = []
) => ({ unitId, rank, alliance, faction, traits })

describe("buildHseTeamRecommendations — Psyker Boost", () => {
  const result = build("hse-trait-boost-psyker")

  it("suggests one Arena team and three alliance teams for Onslaught and Salvage Run", () => {
    expect(result.modes.map((entry) => entry.mode)).toEqual([
      "Arena",
      "Onslaught",
      "SalvageRun",
    ])
    expect(modeOf(result, "Arena").teams.map((t) => t.alliance)).toEqual([null])
    for (const mode of ["Onslaught", "SalvageRun"] as const) {
      expect(modeOf(result, mode).teams.map((t) => t.alliance)).toEqual([
        "Imperial",
        "Chaos",
        "Xenos",
      ])
    }
  })

  it("leads the Imperial Onslaught team with its four Psykers by combat power, filled with the strongest other Imperial character", () => {
    const team = ready(teamOf(modeOf(result, "Onslaught"), "Imperial"))

    expect(ids(team)).toEqual([
      "bloodMephiston",
      "ultraTigurius",
      "spaceStormcaller",
      "astraPrimarisPsy",
      "ultraCalgar",
    ])
    expect(team.team.broadened).toBe(true)
    expect(team.pick).toEqual({ kind: "event-units" })
    expect(team.team.members[0]?.rationale).toEqual({
      kind: "event-unit",
      match: { via: "trait", id: "Psyker" },
    })
    expect(team.team.members[4]?.rationale.kind).toBe("strength")
  })

  it("fills the Chaos teams from the five Chaos Psykers alone, by combat power, not broadened", () => {
    for (const mode of ["Onslaught", "SalvageRun"] as const) {
      const team = ready(teamOf(modeOf(result, mode), "Chaos"))
      expect(ids(team)).toEqual([
        "thousAhriman",
        "thousInfernalMaster",
        "thousSorcerer",
        "deathTyphus",
        "blackPossession",
      ])
      expect(team.team.broadened).toBe(false)
      expect(
        team.team.members.every((m) => m.rationale.kind === "event-unit")
      ).toBe(true)
    }
  })

  it("keeps every alliance team inside its alliance", () => {
    const imperial = new Set(
      hseTeamsFixtureCharacters
        .filter((c) => c.alliance === "Imperial")
        .map((c) => c.unitId)
    )
    for (const mode of ["Onslaught", "SalvageRun"] as const) {
      for (const unitId of ids(teamOf(modeOf(result, mode), "Imperial")))
        expect(imperial.has(unitId)).toBe(true)
    }
  })

  it("draws the Arena team from every alliance, Psykers first", () => {
    const team = ready(teamOf(modeOf(result, "Arena"), null))
    expect(ids(team)).toEqual([
      "thousAhriman",
      "bloodMephiston",
      "thousInfernalMaster",
      // Equal combat power: by unit id.
      "thousSorcerer",
      "ultraTigurius",
    ])
    expect(team.team.broadened).toBe(false)
    expect(team.team.requestedSize).toBe(5)
  })

  it("shows the insufficient-roster state for an alliance with two characters", () => {
    const team = teamOf(modeOf(result, "Onslaught"), "Xenos")
    expect(team).toMatchObject({
      status: "insufficient",
      ownedCount: 2,
      needed: 1,
    })
    if (team.status !== "insufficient") throw new Error("expected shortfall")
    expect(team.eligible.map((c) => c.unitId).sort()).toEqual([
      "eldarFarseer",
      "necroSpyder",
    ])
  })

  it("has no enemy hint (only Summons are left out)", () => {
    for (const entry of result.modes) expect(entry.hints).toEqual([])
  })
})

describe("buildHseTeamRecommendations — player filters", () => {
  it("ranks Faction Boost's double matches (Dark Angels) before other Imperial characters", () => {
    const characters = [
      ...hseTeamsFixtureCharacters,
      extra("darkaAsmodai", "Bronze1", "Imperial", "DarkAngels"),
    ]
    const result = build("hse-faction-boost", {
      variantKey: "DarkAngels",
      characters,
    })
    const team = ready(teamOf(modeOf(result, "Arena"), null))

    expect(ids(team)).toEqual([
      "darkaAzrael",
      "darkaAsmodai",
      "ultraCalgar",
      "bloodMephiston",
      "ultraTigurius",
    ])
    expect(team.team.members[0]?.rationale).toEqual({
      kind: "event-unit",
      match: { via: "faction", id: "DarkAngels" },
    })
    expect(team.team.members[2]?.rationale).toEqual({
      kind: "event-unit",
      match: { via: "alliance", id: "Imperial" },
    })
    expect(team.team.broadened).toBe(false)
  })

  it("leads For the Emperor's teams with Imperial units and says only non-Imperial enemies count", () => {
    const result = build("hse-for-the-emperor")
    const arena = modeOf(result, "Arena")

    expect(arena.hints).toEqual([
      { allowed: [], excluded: [{ via: "alliance", id: "Imperial" }] },
    ])
    expect(ids(teamOf(arena, null))).toEqual([
      "ultraCalgar",
      "darkaAzrael",
      "bloodMephiston",
      "ultraTigurius",
      "spaceStormcaller",
    ])
    // No Chaos character scores, so the Chaos team is the strongest Chaos five, marked broadened.
    const chaos = ready(teamOf(modeOf(result, "Onslaught"), "Chaos"))
    expect(chaos.team.broadened).toBe(true)
    expect(
      chaos.team.members.every((m) => m.rationale.kind === "strength")
    ).toBe(true)
  })

  it("names Squig Smash's only scoring enemy and fields the strongest roster", () => {
    const result = build("hse-squig-smash")
    const arena = modeOf(result, "Arena")

    expect(arena.hints).toEqual([
      { allowed: [{ via: "unit", id: "orksNpc7Squig" }], excluded: [] },
    ])
    const team = ready(teamOf(arena, null))
    expect(team.pick).toEqual({ kind: "any-unit" })
    expect(ids(team)[0]).toBe("ultraCalgar")
  })

  it("makes Defeat Waves teams (no player filter) the strongest five of each roster", () => {
    const result = build("hse-defeat-waves")

    expect(result.modes.map((entry) => entry.mode)).toEqual([
      "Onslaught",
      "SalvageRun",
    ])
    const team = ready(teamOf(modeOf(result, "Onslaught"), "Imperial"))
    expect(team.pick).toEqual({ kind: "any-unit" })
    expect(team.team.broadened).toBe(false)
    expect(ids(team)).toEqual([
      "ultraCalgar",
      "darkaAzrael",
      "bloodMephiston",
      "ultraTigurius",
      "spaceStormcaller",
    ])
    expect(
      team.team.members.every((m) => m.rationale.kind === "strength")
    ).toBe(true)
    expect(modeOf(result, "Onslaught").hints).toEqual([])
  })

  it("suggests only the three Onslaught teams for 11th Edition Week 2", () => {
    const result = build("hse-11th-edition-week-2")

    expect(result.modes.map((entry) => entry.mode)).toEqual(["Onslaught"])
    expect(modeOf(result, "Onslaught").teams).toHaveLength(3)
    expect(ready(teamOf(modeOf(result, "Onslaught"), "Chaos")).pick).toEqual({
      kind: "any-unit",
    })
  })

  it("gives Warp Surge an Arena team only, with its Chaos-enemy hint", () => {
    const result = build("hse-warp-surge")

    expect(result.modes.map((entry) => entry.mode)).toEqual(["Arena"])
    expect(modeOf(result, "Arena").hints).toEqual([
      { allowed: [{ via: "alliance", id: "Chaos" }], excluded: [] },
    ])
  })

  it("keeps 11th Edition Week 3's Arena team unbroadened: any unit scores, Blood Angels and Orks lead", () => {
    const result = build("hse-11th-edition-week-3")
    const team = ready(teamOf(modeOf(result, "Arena"), null))

    expect(team.pick).toEqual({ kind: "event-units" })
    expect(team.team.broadened).toBe(false)
    expect(ids(team)).toEqual([
      "bloodMephiston",
      "ultraCalgar",
      "thousAhriman",
      "darkaAzrael",
      "thousInfernalMaster",
    ])
    expect(team.team.members[0]?.rationale).toEqual({
      kind: "event-unit",
      match: { via: "faction", id: "BloodAngels" },
    })
    // The others score through the any-unit tracker: "Scores for the event", no named match.
    for (const member of team.team.members.slice(1))
      expect(member.rationale).toEqual({ kind: "event-unit" })
  })

  it("suggests no team for an event that scores in no token mode (Arsenal of War)", () => {
    expect(build("hse-arsenal-of-war").modes).toEqual([])
  })
})

describe("buildHseTeamRecommendations — Faction Focus", () => {
  const xenos = [
    extra("necroA", "Gold1", "Xenos", "Necrons"),
    extra("necroB", "Gold1", "Xenos", "Necrons"),
    extra("necroC", "Gold1", "Xenos", "Necrons"),
    extra("necroD", "Gold1", "Xenos", "Necrons"),
    extra("necroE", "Gold1", "Xenos", "Necrons"),
    // One stronger Aeldari character does not outweigh five Necrons.
    extra("eldarA", "Diamond3", "Xenos", "Aeldari"),
    extra("eldarB", "Silver1", "Xenos", "Aeldari"),
  ]

  it("picks the faction whose five strongest sum highest, and names it", () => {
    const result = build("hse-faction-focus", {
      characters: [...hseTeamsFixtureCharacters.slice(0, 11), ...xenos],
    })

    for (const mode of ["Arena", "Onslaught", "SalvageRun"] as const)
      expect(modeOf(result, mode).teams.length).toBeGreaterThan(0)
    const team = ready(teamOf(modeOf(result, "Onslaught"), "Xenos"))
    expect(team.pick).toEqual({ kind: "faction", factionId: "Necrons" })
    expect(new Set(ids(team))).toEqual(
      new Set(["necroA", "necroB", "necroC", "necroD", "necroE"])
    )
    expect(team.team.members[0]?.rationale).toEqual({
      kind: "event-unit",
      match: { via: "faction", id: "Necrons" },
    })
    expect(team.team.broadened).toBe(false)
  })

  it("prefers a faction with five owned characters over a stronger one with fewer", () => {
    const weakNecrons = ["necroA", "necroB", "necroC", "necroD"].map((id) =>
      extra(id, "Stone1", "Xenos", "Necrons")
    )
    const result = build("hse-faction-focus", {
      characters: [...hseTeamsFixtureCharacters, ...weakNecrons],
    })
    // Thousand Sons (three owned, the strongest sum) cannot field a full line-up; Necrons (five) can.
    const team = ready(teamOf(modeOf(result, "Arena"), null))
    expect(team.pick).toEqual({ kind: "faction", factionId: "Necrons" })
    expect(new Set(ids(team))).toEqual(
      new Set(["necroSpyder", "necroA", "necroB", "necroC", "necroD"])
    )
    expect(team.team.broadened).toBe(false)
  })

  it("falls back to the strongest sum when no faction has five, marked broadened", () => {
    const team = ready(
      teamOf(modeOf(build("hse-faction-focus"), "Arena"), null)
    )
    expect(team.pick).toEqual({ kind: "faction", factionId: "ThousandSons" })
    expect(team.team.broadened).toBe(true)
  })

  it("breaks a tie by faction id", () => {
    const tied = [
      extra("orkA", "Gold1", "Xenos", "Orks"),
      extra("orkB", "Gold1", "Xenos", "Orks"),
      extra("necroA", "Gold1", "Xenos", "Necrons"),
      extra("necroB", "Gold1", "Xenos", "Necrons"),
    ]
    const result = build("hse-faction-focus", {
      variantKey: "october-2026",
      characters: tied,
    })
    const team = ready(teamOf(modeOf(result, "SalvageRun"), "Xenos"))

    expect(team.pick).toEqual({ kind: "faction", factionId: "Necrons" })
    expect(ids(team).slice(0, 2).sort()).toEqual(["necroA", "necroB"])
    // Only two Necrons: the strongest others fill the team.
    expect(team.team.broadened).toBe(true)
  })
})

import { describe, expect, it } from "vitest"

import type { TeamMode } from "@/entities/team"

import {
  filterTeamsByMode,
  groupTeamsByMode,
  isTeamsGroupBy,
  isTeamsLayout,
  isTeamsModeFilter,
  reorderListedSlots,
  searchTeams,
  sharedUnitsByTeam,
} from "./teams-view"

const teams = [
  { id: "A", modes: ["horde"] as const },
  { id: "B", modes: ["guildRaid"] as const },
  { id: "C", modes: ["horde", "guildRaid"] as const },
]

describe("teams view", () => {
  it("filters by mode, keeping the saved order", () => {
    expect(filterTeamsByMode(teams, "horde").map((team) => team.id)).toEqual([
      "A",
      "C",
    ])
    expect(filterTeamsByMode(teams, "all")).toHaveLength(3)
    expect(filterTeamsByMode(teams, "incursion")).toEqual([])
  })

  it("moves teams only among the slots the listed teams hold", () => {
    // A (Horde), B (Guild Raid), C (Horde), Horde listed: C moved above A.
    expect(reorderListedSlots(["A", "B", "C"], ["C", "A"])).toEqual([
      "C",
      "B",
      "A",
    ])
    expect(reorderListedSlots(["A", "B", "C", "D"], ["D", "B"])).toEqual([
      "A",
      "D",
      "C",
      "B",
    ])
  })

  it("accepts All and the seven modes only", () => {
    expect(isTeamsModeFilter("all")).toBe(true)
    expect(isTeamsModeFilter("warOffense")).toBe(true)
    expect(isTeamsModeFilter("raid")).toBe(false)
    expect(isTeamsModeFilter(null)).toBe(false)
  })
})

const lineup = (
  id: string,
  modes: TeamMode[],
  characterIds: string[],
  mowIds: string[] = []
) => ({ id, name: `Team ${id}`, modes, characterIds, mowIds })

describe("layout and grouping", () => {
  it("accepts only the known layouts and groupings", () => {
    expect(isTeamsLayout("table")).toBe(true)
    expect(isTeamsLayout("list")).toBe(false)
    expect(isTeamsGroupBy("mode")).toBe(true)
    expect(isTeamsGroupBy(undefined)).toBe(false)
  })

  it("puts a team once, under the first of its modes, and skips empty modes", () => {
    const sections = groupTeamsByMode([
      { id: "GR+H", modes: ["horde", "guildRaid"] as const },
      { id: "H", modes: ["horde"] as const },
    ])
    expect(sections.map((section) => section.mode)).toEqual([
      "guildRaid",
      "horde",
    ])
    expect(sections[0]?.teams.map((team) => team.id)).toEqual(["GR+H"])
    expect(sections[1]?.teams.map((team) => team.id)).toEqual(["H"])
  })

  it("puts teams with no mode last, in a section of their own", () => {
    const sections = groupTeamsByMode([
      { id: "none", modes: [] as const },
      { id: "H", modes: ["horde"] as const },
    ])
    expect(sections.map((section) => section.mode)).toEqual(["horde", null])
    expect(sections[1]?.teams.map((team) => team.id)).toEqual(["none"])
  })
})

describe("search", () => {
  const unitName = (_kind: "Character" | "Mow", id: string) =>
    ({ calgar: "Calgar", dread: "Dreadnought" })[id] ?? id
  const list = [
    lineup("A", ["horde"], ["calgar"]),
    lineup("B", ["horde"], ["titus"], ["dread"]),
  ]

  it("matches team names and unit names, ignoring case", () => {
    expect(searchTeams(list, "team b", unitName).map((t) => t.id)).toEqual([
      "B",
    ])
    expect(searchTeams(list, "CALGAR", unitName).map((t) => t.id)).toEqual([
      "A",
    ])
    expect(searchTeams(list, "dread", unitName).map((t) => t.id)).toEqual(["B"])
    expect(searchTeams(list, "  ", unitName)).toHaveLength(2)
  })
})

describe("shared units", () => {
  it("counts core and flex units, only across a Guild War mode the teams have in common", () => {
    const shared = sharedUnitsByTeam([
      lineup("A", ["warOffense"], ["calgar", "titus"]),
      lineup("B", ["warOffense", "horde"], ["titus"]),
      lineup("C", ["horde"], ["calgar"]),
    ])
    expect(shared.get("A")).toEqual(["titus"])
    expect(shared.get("B")).toEqual(["titus"])
    // Calgar is in A (war) and C (horde): no mode in common.
    expect(shared.has("C")).toBe(false)
  })

  it("lets a unit be in an offense and a defense team, and in any teams of other modes", () => {
    const shared = sharedUnitsByTeam([
      lineup("O", ["warOffense"], ["calgar"]),
      lineup("D", ["warDefense"], ["calgar"]),
      lineup("H1", ["horde", "guildRaid"], ["titus"]),
      lineup("H2", ["horde", "guildRaid"], ["titus"]),
      lineup("D2", ["warDefense"], ["calgar"]),
    ])
    expect(shared.has("O")).toBe(false)
    expect(shared.has("H1")).toBe(false)
    expect(shared.has("H2")).toBe(false)
    expect(shared.get("D")).toEqual(["calgar"])
    expect(shared.get("D2")).toEqual(["calgar"])
  })
})

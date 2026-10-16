import { describe, expect, it } from "vitest"

import { utharEvent } from "@/test/fixtures/legendary-events"

import {
  estimatedAvailability,
  nextMasterTableParams,
  parseMasterTableQuery,
  resolveMasterTableState,
  type MasterTablePickerEvent,
  type UnitSetAvailability,
} from "./master-table.view-model"

const PICKER: MasterTablePickerEvent[] = [
  { id: "votanUthar", archived: false },
  { id: "tauFarsight", archived: false },
  { id: "astarLysander", archived: false },
  { id: "bloodDante", archived: true },
]
const READY: UnitSetAvailability = { unlocked: "ready", inTeams: "ready" }

function resolve(
  search: string,
  {
    teams = [] as string[],
    unitSets = READY,
    estimated = "ready" as const,
  }: {
    teams?: string[]
    unitSets?: UnitSetAvailability
    estimated?: Parameters<typeof resolveMasterTableState>[0]["estimated"]
  } = {}
) {
  return resolveMasterTableState({
    query: parseMasterTableQuery(new URLSearchParams(search)),
    pickerEvents: PICKER,
    hasTeams: (ids) => ids.some((id) => teams.includes(id)),
    unitSets,
    estimated,
  })
}

describe("resolveMasterTableState", () => {
  it("defaults to every active and upcoming event, All, Remaining and the total", () => {
    expect(resolve("")).toEqual({
      selectedEventIds: ["votanUthar", "tauFarsight", "astarLysander"],
      unitSet: "all",
      points: "remaining",
      estimatedFallback: false,
      sort: null,
      q: "",
    })
  })

  it("restores a shared link, in picker order", () => {
    expect(
      resolve(
        "events=tauFarsight,votanUthar&units=unlocked&points=all&sort=tauFarsight"
      )
    ).toMatchObject({
      selectedEventIds: ["votanUthar", "tauFarsight"],
      unitSet: "unlocked",
      points: "all",
      sort: "tauFarsight",
    })
  })

  it("drops unknown ids, and falls back to the default when none is known", () => {
    expect(resolve("events=votanUthar,notAnEvent").selectedEventIds).toEqual([
      "votanUthar",
    ])
    expect(resolve("events=notAnEvent").selectedEventIds).toHaveLength(3)
  })

  it("keeps an empty selection", () => {
    expect(resolve("events=").selectedEventIds).toEqual([])
  })

  it("falls back to defaults for invalid values and a sort outside the selection", () => {
    expect(resolve("units=everyone&points=most&sort=bloodDante")).toMatchObject(
      { unitSet: "all", points: "remaining", sort: null }
    )
  })

  it("derives In teams when a selected plan has a team, only while units is absent", () => {
    expect(resolve("events=tauFarsight").unitSet).toBe("all")
    expect(
      resolve("events=tauFarsight,votanUthar", { teams: ["votanUthar"] })
        .unitSet
    ).toBe("inTeams")
    expect(
      resolve("units=all&events=votanUthar", { teams: ["votanUthar"] }).unitSet
    ).toBe("all")
  })

  it("falls back to All when a set is unavailable", () => {
    expect(
      resolve("units=inTeams", {
        unitSets: { unlocked: "ready", inTeams: "failed" },
      }).unitSet
    ).toBe("all")
    expect(
      resolve("units=unlocked", {
        unitSets: { unlocked: "noRoster", inTeams: "ready" },
      }).unitSet
    ).toBe("all")
    expect(
      resolve("", {
        teams: ["votanUthar"],
        unitSets: { unlocked: "ready", inTeams: "loading" },
      }).unitSet
    ).toBe("all")
  })

  it("shows Remaining with a note when Estimated is unavailable", () => {
    expect(
      resolve("points=estimated", { estimated: "unavailable" })
    ).toMatchObject({ points: "remaining", estimatedFallback: true })
    expect(resolve("points=estimated", { estimated: "loading" })).toMatchObject(
      {
        points: "estimated",
        estimatedFallback: false,
      }
    )
  })
})

describe("nextMasterTableParams", () => {
  it("sets, removes and keeps an empty event selection", () => {
    const params = new URLSearchParams("units=all&q=dan")
    const next = nextMasterTableParams(params, {
      points: "estimated",
      q: null,
      events: "",
    })
    expect(next.toString()).toBe("units=all&points=estimated&events=")
  })
})

describe("estimatedAvailability", () => {
  const battles = Object.fromEntries([
    [
      "votanUthar",
      ["alpha", "beta", "gamma"].flatMap((lane) =>
        utharEvent[lane as "alpha"].battleIds.map((id) => ({ id, power: 100 }))
      ),
    ],
  ]) as never
  const config = { status: "ready", config: {} } as never

  it("is ready with config, battles and a roster", () => {
    expect(
      estimatedAvailability({
        config,
        battles,
        rosterKnown: true,
        events: [utharEvent],
      })
    ).toBe("ready")
  })

  it("needs a roster, the config and every lane's battles", () => {
    expect(
      estimatedAvailability({ config, battles, rosterKnown: false, events: [] })
    ).toBe("noRoster")
    expect(
      estimatedAvailability({
        config: { status: "failed", retry: () => {} },
        battles,
        rosterKnown: true,
        events: [utharEvent],
      })
    ).toBe("unavailable")
    expect(
      estimatedAvailability({
        config,
        battles: "loading",
        rosterKnown: true,
        events: [utharEvent],
      })
    ).toBe("loading")
    expect(
      estimatedAvailability({
        config,
        battles: {},
        rosterKnown: true,
        events: [utharEvent],
      })
    ).toBe("unavailable")
  })
})

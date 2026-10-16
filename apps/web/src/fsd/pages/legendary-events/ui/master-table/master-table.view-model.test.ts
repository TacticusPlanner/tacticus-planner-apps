import { describe, expect, it } from "vitest"

import { utharEvent } from "@/test/fixtures/legendary-events"

import type { LegendaryEventProgress } from "@/entities/legendary-event"

import {
  estimatedAvailability,
  masterTableEventInputs,
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
      estimatedFallback: null,
      pending: false,
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
  })

  it("keeps a requested set whose input is still loading, pending, instead of falling back", () => {
    expect(
      resolve("units=unlocked", {
        unitSets: { unlocked: "loading", inTeams: "ready" },
      })
    ).toMatchObject({ unitSet: "unlocked", pending: true })
    expect(
      resolve("units=inTeams", {
        unitSets: { unlocked: "ready", inTeams: "loading" },
      })
    ).toMatchObject({ unitSet: "inTeams", pending: true })
    // A set that does not depend on the loading input is not pending.
    expect(
      resolve("units=all", {
        unitSets: { unlocked: "loading", inTeams: "loading" },
      })
    ).toMatchObject({ unitSet: "all", pending: false })
    // The default waits for the plans: it could turn into In teams.
    expect(
      resolve("", {
        teams: ["votanUthar"],
        unitSets: { unlocked: "ready", inTeams: "loading" },
      })
    ).toMatchObject({ unitSet: "all", pending: true })
  })

  it("shows Remaining with a note when Estimated is unavailable", () => {
    expect(
      resolve("points=estimated", { estimated: "unavailable" })
    ).toMatchObject({ points: "remaining", estimatedFallback: "unavailable" })
    expect(
      resolve("points=estimated", { estimated: "noRoster" })
    ).toMatchObject({ points: "remaining", estimatedFallback: "noRoster" })
    expect(resolve("points=estimated", { estimated: "loading" })).toMatchObject(
      {
        points: "estimated",
        estimatedFallback: null,
        pending: true,
      }
    )
    expect(resolve("points=all", { estimated: "loading" })).toMatchObject({
      points: "all",
      pending: false,
    })
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
        roster: "ready",
        events: [utharEvent],
      })
    ).toBe("ready")
  })

  it("needs a roster, the config and every lane's battles", () => {
    expect(
      estimatedAvailability({ config, battles, roster: "noRoster", events: [] })
    ).toBe("noRoster")
    expect(
      estimatedAvailability({
        config,
        battles,
        roster: "loading",
        events: [utharEvent],
      })
    ).toBe("loading")
    expect(
      estimatedAvailability({
        config: { status: "loading" },
        battles,
        roster: "ready",
        events: [utharEvent],
      })
    ).toBe("loading")
    expect(
      estimatedAvailability({
        config: { status: "failed", retry: () => {} },
        battles,
        roster: "ready",
        events: [utharEvent],
      })
    ).toBe("unavailable")
    expect(
      estimatedAvailability({
        config,
        battles: "loading",
        roster: "ready",
        events: [utharEvent],
      })
    ).toBe("loading")
    expect(
      estimatedAvailability({
        config,
        battles: {},
        roster: "ready",
        events: [utharEvent],
      })
    ).toBe("unavailable")
  })
})

describe("masterTableEventInputs", () => {
  const NOW = Date.parse("2026-10-16T00:00:00Z")
  const progress = (currentPoints: number) =>
    ({
      id: "votanUthar",
      currentEventRun: null,
      currentPoints,
      alpha: null,
      beta: null,
      gamma: null,
    }) as unknown as LegendaryEventProgress

  it("reads depths for the next run between runs (Uthar: run 3)", () => {
    const [input] = masterTableEventInputs({
      events: [
        {
          ...utharEvent,
          eventStageStartDatesUtc: [
            "2026-03-08T00:00:00Z",
            "2026-10-04T00:00:00Z",
          ],
        },
      ],
      plans: undefined,
      progress: [progress(13_139)],
      battles: undefined,
      nowMs: NOW,
    })

    expect(input?.run).toBe(3)
  })

  it("reads depths for run 1 when the run is unknown", () => {
    const [input] = masterTableEventInputs({
      events: [{ ...utharEvent, eventStageStartDatesUtc: [] }],
      plans: undefined,
      progress: [progress(12_530)],
      battles: undefined,
      nowMs: NOW,
    })

    expect(input?.run).toBe(1)
  })
})

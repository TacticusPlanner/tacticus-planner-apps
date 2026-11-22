import { describe, expect, it } from "vitest"

import { hreShardSources, nextHreBoundaryMs } from "./hre-shard-sources"

const definitions = new Map([
  ["new-character-event", { type: "NewCharacterEvent" }],
  ["home-screen-event", { type: "HomeScreenEvent" }],
])
const hre = (
  occurrenceId: string,
  featuredCharacterId: string | null,
  startUtc: string,
  endUtc: string
) => ({
  occurrenceId,
  definitionId: "new-character-event",
  startUtc,
  endUtc,
  parameters: featuredCharacterId ? { featuredCharacterId } : {},
})
const daras = hre(
  "occ-daras",
  "astraDaras",
  "2026-11-20T00:00:00Z",
  "2026-12-04T00:00:00Z"
)
const darasRerun = hre(
  "occ-daras-2",
  "astraDaras",
  "2027-03-01T00:00:00Z",
  "2027-03-15T00:00:00Z"
)
const kariyan = hre(
  "occ-kariyan",
  "tauKariyan",
  "2026-12-10T00:00:00Z",
  "2026-12-24T00:00:00Z"
)
const past = hre(
  "occ-past",
  "orksWeirdboy",
  "2026-10-18T00:00:00Z",
  "2026-11-01T00:00:00Z"
)
const hse = {
  ...kariyan,
  occurrenceId: "occ-hse",
  definitionId: "home-screen-event",
  parameters: { featuredCharacterId: "spaceMarineHse" },
}
const at = (iso: string) => Date.parse(iso)

describe("hreShardSources", () => {
  it("lists running and upcoming featured heroes, not past ones or other events", () => {
    const sources = hreShardSources(
      [past, daras, kariyan, hse],
      definitions,
      at("2026-11-22T12:00:00Z")
    )
    expect([...sources.keys()]).toEqual(["astraDaras", "tauKariyan"])
    expect(sources.get("astraDaras")).toEqual({
      characterId: "astraDaras",
      status: "running",
      eventKey: "occ-daras",
      startUtc: daras.startUtc,
      endUtc: daras.endUtc,
    })
    expect(sources.get("tauKariyan")?.status).toBe("upcoming")
  })

  it("prefers the running event over a later rerun, and the earliest upcoming one", () => {
    expect(
      hreShardSources(
        [darasRerun, daras],
        definitions,
        at("2026-11-22T00:00:00Z")
      ).get("astraDaras")?.eventKey
    ).toBe("occ-daras")
    expect(
      hreShardSources(
        [darasRerun, daras],
        definitions,
        at("2026-11-01T00:00:00Z")
      ).get("astraDaras")
    ).toMatchObject({ status: "upcoming", eventKey: "occ-daras" })
  })

  it("drops a hero once their event has ended (end exclusive)", () => {
    expect(hreShardSources([daras], definitions, at(daras.endUtc)).size).toBe(0)
  })

  it("skips an event without a featured hero", () => {
    expect(
      hreShardSources(
        [hre("occ-x", null, daras.startUtc, daras.endUtc)],
        definitions,
        at("2026-11-22T00:00:00Z")
      ).size
    ).toBe(0)
  })
})

describe("nextHreBoundaryMs", () => {
  it("is the next start or end of any HRE after now", () => {
    expect(
      nextHreBoundaryMs(
        [daras, kariyan],
        definitions,
        at("2026-11-22T00:00:00Z")
      )
    ).toBe(at(daras.endUtc))
    expect(
      nextHreBoundaryMs([daras, kariyan], definitions, at(daras.endUtc))
    ).toBe(at(kariyan.startUtc))
  })

  it("is null when nothing more is scheduled", () => {
    expect(
      nextHreBoundaryMs([past], definitions, at("2026-11-22T00:00:00Z"))
    ).toBeNull()
  })
})

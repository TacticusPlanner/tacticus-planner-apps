import { describe, expect, it } from "vitest"

import { readCompareQuery, resolveCompareSources } from "./compare-query"

const read = (search: string) => readCompareQuery(new URLSearchParams(search))

const oct = { id: "oct", takenAt: "2026-10-01T00:00:00Z" }
const nov = { id: "nov", takenAt: "2026-11-01T00:00:00Z" }
const sources = [nov, oct]

describe("readCompareQuery", () => {
  it("is normal Collection without compare, dropping the other params", () => {
    const { query, fixes } = read("to=nov&le=uthar&order=rank")
    expect(query.compare).toBeNull()
    expect(fixes).toEqual({ to: null, le: null, order: null })
  })

  it("reads the params and omits defaults", () => {
    const { query, fixes } = read(
      "compare=oct&to=current&le=uthar&lane=alpha&order=rank"
    )
    expect(query).toEqual({
      compare: "oct",
      to: "current",
      event: "uthar",
      lane: "alpha",
      order: "rank",
    })
    expect(fixes).toEqual({ to: null })
  })

  it("drops an invalid lane and order", () => {
    expect(read("compare=latest&le=uthar&lane=delta&order=x").fixes).toEqual({
      lane: null,
      order: null,
    })
    expect(read("compare=latest&lane=alpha").fixes).toEqual({ lane: null })
  })
})

describe("resolveCompareSources", () => {
  it("resolves latest to the newest source, compared with Current", () => {
    expect(
      resolveCompareSources(
        { compare: "latest", to: "current", event: null },
        sources
      )
    ).toEqual({ from: "nov", to: "current", fixes: {} })
  })

  it("keeps a shared link's two snapshots", () => {
    expect(
      resolveCompareSources({ compare: "oct", to: "nov", event: null }, sources)
    ).toEqual({ from: "oct", to: "nov", fixes: {} })
  })

  it("falls back to latest for a deleted snapshot", () => {
    expect(
      resolveCompareSources(
        { compare: "gone", to: "current", event: null },
        sources
      )
    ).toEqual({ from: "nov", to: "current", fixes: { compare: "latest" } })
  })

  it("falls back to Current when to is not newer than from", () => {
    expect(
      resolveCompareSources({ compare: "nov", to: "oct", event: null }, sources)
    ).toEqual({ from: "nov", to: "current", fixes: { to: null } })
  })

  it("has no source when none exists, and drops an unknown event", () => {
    expect(
      resolveCompareSources(
        { compare: "latest", to: "current", event: "uthar" },
        [],
        []
      )
    ).toEqual({
      from: null,
      to: "current",
      fixes: { le: null, lane: null },
    })
  })
})

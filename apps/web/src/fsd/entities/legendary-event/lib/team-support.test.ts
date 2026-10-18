import { describe, expect, it } from "vitest"

import { withSupport, type SupportCandidate } from "./team-support"

const unit = (id: string, ...traits: string[]): SupportCandidate => ({
  id,
  traits,
})
const ids = (team: readonly SupportCandidate[]) => team.map((u) => u.id)

describe("withSupport (spec: team suggestions per lane, Support)", () => {
  it("swaps the strongest outside Healer in for the last plain member of a non-mechanical team", () => {
    const candidates = [
      unit("a"),
      unit("b"),
      unit("c"),
      unit("d"),
      unit("e"),
      unit("healer", "Healer"),
      unit("healer2", "Healer"),
    ]
    expect(ids(withSupport(candidates.slice(0, 5), candidates, 5))).toEqual([
      "a",
      "b",
      "c",
      "d",
      "healer",
    ])
  })

  it("adds no Healer to a fully mechanical team", () => {
    const candidates = [
      ...["a", "b", "c", "d", "e"].map((id) => unit(id, "Mechanical")),
      unit("healer", "Healer"),
    ]
    expect(ids(withSupport(candidates.slice(0, 5), candidates, 5))).toEqual([
      "a",
      "b",
      "c",
      "d",
      "e",
    ])
  })

  it("swaps a Mechanic in when the team has a Mechanical member", () => {
    const candidates = [
      unit("healer", "Healer"),
      unit("tank", "Mechanical"),
      unit("c"),
      unit("d"),
      unit("e"),
      unit("mechanic", "Mechanic"),
    ]
    expect(ids(withSupport(candidates.slice(0, 5), candidates, 5))).toEqual([
      "healer",
      "tank",
      "c",
      "d",
      "mechanic",
    ])
  })

  it("adds no Mechanic to a team without a Mechanical member", () => {
    const candidates = [
      unit("healer", "Healer"),
      unit("b"),
      unit("c"),
      unit("d"),
      unit("e"),
      unit("mechanic", "Mechanic"),
    ]
    expect(ids(withSupport(candidates.slice(0, 5), candidates, 5))).toEqual([
      "healer",
      "b",
      "c",
      "d",
      "e",
    ])
  })

  it("keeps a team that already holds a useful Healer", () => {
    const candidates = [
      unit("a"),
      unit("healer", "Healer"),
      unit("c"),
      unit("d"),
      unit("e"),
      unit("healer2", "Healer"),
    ]
    expect(ids(withSupport(candidates.slice(0, 5), candidates, 5))).toEqual([
      "a",
      "healer",
      "c",
      "d",
      "e",
    ])
  })

  it("leaves a short team alone (it already holds every candidate)", () => {
    const candidates = [unit("a"), unit("b"), unit("c")]
    expect(ids(withSupport(candidates, candidates, 5))).toEqual(["a", "b", "c"])
  })
})

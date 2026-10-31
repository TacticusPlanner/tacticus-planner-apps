import { describe, expect, it } from "vitest"

import {
  hasLaneDefaultName,
  teamDisplayName,
  withLanePrefix,
  type NamedTeam,
} from "./team-display-name"

// Uthar Alpha's objectives as labelled (catalog order is by `index`).
const alphaObjectives = [
  { index: 2, label: "Melee" },
  { index: 0, label: "Max 2 hits" },
  { index: 1, label: "No Psykers" },
]
const numbered = (position: number) => `Team ${position}`

const team = (overrides: Partial<NamedTeam>): NamedTeam => ({
  laneId: "alpha",
  name: "alpha",
  objectiveIndexes: [],
  sortOrder: 0,
  ...overrides,
})

describe("teamDisplayName", () => {
  it("names an imported team stored as its lane by its covered objectives, in lane order", () => {
    const imported = team({ objectiveIndexes: [2, 0] })
    expect(
      teamDisplayName(imported, alphaObjectives, [imported], numbered)
    ).toBe("α · Max 2 hits · Melee")
  })

  it("keeps a chosen name", () => {
    const chosen = team({ name: "Melee rush", objectiveIndexes: [2] })
    expect(teamDisplayName(chosen, alphaObjectives, [chosen], numbered)).toBe(
      "Melee rush"
    )
  })

  it("numbers a lane-named team that covers no objective by its position in the lane", () => {
    const first = team({ objectiveIndexes: [0, 2] })
    const second = team({ sortOrder: 1 })
    const otherLane = team({ laneId: "beta", name: "beta", sortOrder: 0 })
    expect(
      teamDisplayName(
        second,
        alphaObjectives,
        [otherLane, second, first],
        numbered
      )
    ).toBe("α · Team 2")
  })

  it("matches the lane id case-insensitively and treats an empty name as unnamed", () => {
    const capitalised = team({ name: "Alpha", objectiveIndexes: [0] })
    const blank = team({ name: "  ", objectiveIndexes: [1] })
    expect(
      teamDisplayName(capitalised, alphaObjectives, [capitalised], numbered)
    ).toBe("α · Max 2 hits")
    expect(teamDisplayName(blank, alphaObjectives, [blank], numbered)).toBe(
      "α · No Psykers"
    )
  })

  it("prefixes the lane's Greek letter", () => {
    const beta = team({ laneId: "beta", name: "", objectiveIndexes: [0] })
    expect(teamDisplayName(beta, alphaObjectives, [beta], numbered)).toBe(
      "β · Max 2 hits"
    )
  })

  it("keeps a prefixed name within the 60-character limit", () => {
    expect(withLanePrefix("alpha", "x".repeat(57))).toHaveLength(60)
  })

  it("does not treat another lane's id as a default name", () => {
    expect(hasLaneDefaultName(team({ name: "beta" }))).toBe(false)
    expect(hasLaneDefaultName(team({ name: "ALPHA" }))).toBe(true)
  })
})

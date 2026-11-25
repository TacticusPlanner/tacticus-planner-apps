import { describe, expect, it } from "vitest"

import type { TeamRoster } from "@/entities/team"

import { attackFields } from "./attack-draft"
import { EMPTY_ENEMY } from "./enemy-draft"

const unit = {
  progression: "Epic:RedOneStar",
  rank: "Gold1",
  xpLevel: 40,
  abilityLevels: [30, 28],
}
const roster = {
  characters: new Map([
    ["a", unit],
    ["b", unit],
  ]),
  mows: new Map([["m", { ...unit, rank: undefined }]]),
} as unknown as TeamRoster

const draft = (overrides = {}) =>
  attackFields({
    selection: new Map([
      ["a", "character"],
      ["m", "mow"],
      ["b", "character"],
    ]),
    roster,
    zoneId: "Armoury",
    slot: 2,
    result: "won",
    lostIds: new Set(["b", "m", "x"]),
    notes: "  Slow start.  ",
    enemy: EMPTY_ENEMY,
    ...overrides,
  })

describe("attackFields", () => {
  it("keeps the lost units of the lineup, in lineup order, and trims the note", () => {
    const fields = draft()
    expect(fields.characters.map((entry) => entry.unitId)).toEqual(["a", "b"])
    expect(fields.mow?.unitId).toBe("m")
    expect(fields.lostUnitIds).toEqual(["m", "b"])
    expect(fields.notes).toBe("Slow start.")
    expect(fields.enemy).toBeNull()
  })

  it("sends no lost units without a result, and no blank note", () => {
    const fields = draft({ result: "none", notes: "   " })
    expect(fields.result).toBeNull()
    expect(fields.lostUnitIds).toBeNull()
    expect(fields.notes).toBeNull()
  })
})

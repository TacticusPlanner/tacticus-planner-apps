import { describe, expect, it } from "vitest"

import type { TeamRoster } from "@/entities/team"
import type { PickerUnit } from "@/features/team-editor"

import {
  addableUnits,
  attackPicks,
  editedLineup,
  lineupHasCharacter,
  takenByOtherAttacks,
} from "./lineup-edit"
import type { GuildWarAttack } from "./types"

const logged = (unitId: string) => ({
  unitId,
  progression: "Epic:RedOneStar",
  rank: "Gold1",
  xpLevel: 40,
  abilityLevels: [30, 28],
})

const attack = {
  id: "attack-1",
  characters: [logged("a"), logged("b")],
  mow: logged("m"),
} as GuildWarAttack

const synced = {
  progression: "Legendary:RedFiveStars",
  rank: "Diamond3",
  xpLevel: 50,
  abilityLevels: [40, 35],
}
const roster = {
  characters: new Map([
    ["a", synced],
    ["c", synced],
  ]),
  mows: new Map([["n", { ...synced, rank: undefined }]]),
} as unknown as TeamRoster

const unit = (id: string, kind: "character" | "mow", owned = true) =>
  ({ id, kind, owned }) as PickerUnit

describe("editing a logged lineup", () => {
  it("starts from the attack's units, characters first", () => {
    expect([...attackPicks(attack)]).toEqual([
      ["a", "character"],
      ["b", "character"],
      ["m", "mow"],
    ])
  })

  it("keeps logged units as logged and takes added ones from the roster", () => {
    const lineup = editedLineup(
      attack,
      new Map([
        ["a", "character"],
        ["c", "character"],
        ["n", "mow"],
      ]),
      roster
    )
    expect(lineup.characters).toEqual([logged("a"), { unitId: "c", ...synced }])
    expect(lineup.mow).toEqual({ unitId: "n", ...synced, rank: null })
  })

  it("leaves out an added unit the roster lacks", () => {
    const lineup = editedLineup(
      attack,
      new Map([
        ["a", "character"],
        ["z", "character"],
      ]),
      roster
    )
    expect(lineup.characters.map((entry) => entry.unitId)).toEqual(["a"])
    expect(lineup.mow).toBeNull()
  })

  it("frees the edited attack's own units, not the other attacks'", () => {
    const taken = takenByOtherAttacks(new Set(["a", "m", "x"]), attack)
    expect([...taken]).toEqual(["x"])
    expect(takenByOtherAttacks(new Set(["a"]), null)).toEqual(new Set(["a"]))
  })

  it("offers owned units of a kind not picked or taken, while the kind has room", () => {
    const units = [
      unit("a", "character"),
      unit("c", "character"),
      unit("d", "character", false),
      unit("x", "character"),
      unit("n", "mow"),
    ]
    const picks = new Map([["a", "character" as const]])
    expect(
      addableUnits(units, "character", picks, new Set(["x"])).map((u) => u.id)
    ).toEqual(["c"])
    expect(
      addableUnits(units, "mow", picks, new Set()).map((u) => u.id)
    ).toEqual(["n"])
    expect(
      addableUnits(units, "mow", new Map([["m", "mow" as const]]), new Set())
    ).toEqual([])
  })

  it("needs a character to save", () => {
    expect(lineupHasCharacter(new Map([["m", "mow"]]))).toBe(false)
    expect(lineupHasCharacter(new Map([["a", "character"]]))).toBe(true)
  })
})

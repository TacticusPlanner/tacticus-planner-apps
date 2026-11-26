import { describe, expect, it } from "vitest"

import type { TeamRoster } from "@/entities/team"

import {
  attackDetails,
  attackFields,
  editedAttackFields,
  NO_DETAILS,
} from "./attack-draft"
import type { AttackDetails } from "./attack-draft"
import { EMPTY_ENEMY } from "./enemy-draft"
import type { GuildWarAttack } from "./types"

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

const details = (overrides: Partial<AttackDetails> = {}): AttackDetails => ({
  result: "won",
  lostIds: new Set(["b", "m", "x"]),
  notes: "  Slow start.  ",
  enemy: EMPTY_ENEMY,
  ...overrides,
})

const draft = (overrides: Partial<AttackDetails> = {}) =>
  attackFields({
    selection: new Map([
      ["a", "character"],
      ["m", "mow"],
      ["b", "character"],
    ]),
    roster,
    zoneId: "Armoury",
    slot: 2,
    details: details(overrides),
  })

const lineupUnit = (unitId: string) => ({
  unitId,
  progression: "Epic:RedOneStar",
  rank: null,
  xpLevel: 40,
  abilityLevels: [30, 28],
})

const attack = {
  id: "attack-1",
  revision: 3,
  attackedAt: "2026-11-25T10:00:00Z",
  zoneId: "Trenches2",
  slot: 1,
  rarityCap: "Legendary",
  characters: [lineupUnit("a"), lineupUnit("b")],
  mow: lineupUnit("m"),
  result: "lost",
  lostUnitIds: ["a"],
  enemy: null,
  notes: "Too slow",
} as GuildWarAttack

describe("attackFields", () => {
  it("keeps the lost units of the lineup, characters first, and trims the note", () => {
    const fields = draft()
    expect(fields.characters.map((entry) => entry.unitId)).toEqual(["a", "b"])
    expect(fields.mow?.unitId).toBe("m")
    expect(fields.lostUnitIds).toEqual(["b", "m"])
    expect(fields.notes).toBe("Slow start.")
    expect(fields.enemy).toBeNull()
  })

  it("sends no lost units without a result, and no blank note", () => {
    const fields = draft({ result: "none", notes: "   " })
    expect(fields.result).toBeNull()
    expect(fields.lostUnitIds).toBeNull()
    expect(fields.notes).toBeNull()
  })

  it("logs a quick result with nothing else noted", () => {
    const fields = attackFields({
      selection: new Map([["a", "character"]]),
      roster,
      zoneId: "Armoury",
      slot: 0,
      details: { ...NO_DETAILS, result: "lost" },
    })
    expect(fields.result).toBe("lost")
    expect(fields.lostUnitIds).toEqual([])
    expect(fields.notes).toBeNull()
    expect(fields.enemy).toBeNull()
  })
})

describe("editing an attack", () => {
  it("starts from the attack's own details", () => {
    const start = attackDetails(attack)
    expect(start.result).toBe("lost")
    expect([...start.lostIds]).toEqual(["a"])
    expect(start.notes).toBe("Too slow")
    expect(start.enemy).toEqual(EMPTY_ENEMY)
  })

  it("moves the attack to a new zone and slot, keeping its lineup", () => {
    const fields = editedAttackFields(
      attack,
      { zoneId: "Armoury", slot: 4 },
      attackDetails(attack)
    )
    expect(fields.zoneId).toBe("Armoury")
    expect(fields.slot).toBe(4)
    expect(fields.characters).toEqual(attack.characters)
    expect(fields.mow).toEqual(attack.mow)
  })

  it("keeps the logged lineup and sends the new details", () => {
    const fields = editedAttackFields(
      attack,
      { zoneId: attack.zoneId, slot: attack.slot },
      details({ result: "won", lostIds: new Set(["m"]), notes: "" })
    )
    expect(fields.characters).toEqual(attack.characters)
    expect(fields.mow).toEqual(attack.mow)
    expect(fields.zoneId).toBe("Trenches2")
    expect(fields.result).toBe("won")
    expect(fields.lostUnitIds).toEqual(["m"])
    expect(fields.notes).toBeNull()
  })
})

import { describe, expect, it } from "vitest"
import { guildWarFixture } from "@workspace/game-catalog/testing"

import { resolveAttackTarget } from "./attack-target"

const [seasonA, seasonD] = guildWarFixture

describe("resolveAttackTarget", () => {
  it("restores a stored zone and slot", () => {
    expect(
      resolveAttackTarget({ zone: "Armoury", slot: "2" }, seasonA)
    ).toEqual({ zoneId: "Armoury", slot: 2 })
  })

  it("clears a zone the season does not have", () => {
    expect(
      resolveAttackTarget({ zone: "LandingPad1", slot: "0" }, seasonD)
    ).toEqual({ zoneId: null, slot: 0 })
  })

  it("clears a slot outside 1 to 5", () => {
    for (const slot of ["5", "-1", "1.5", "x", ""]) {
      expect(resolveAttackTarget({ zone: "HQ", slot }, seasonA).slot).toBeNull()
    }
  })

  it("has no zone before the catalog loads", () => {
    expect(resolveAttackTarget({ zone: "HQ", slot: "1" }, undefined)).toEqual({
      zoneId: null,
      slot: 1,
    })
  })
})

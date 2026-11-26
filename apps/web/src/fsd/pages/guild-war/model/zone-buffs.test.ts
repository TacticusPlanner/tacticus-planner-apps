import { guildWarFixture } from "@workspace/game-catalog/testing"
import { describe, expect, it } from "vitest"

import type { GuildWarSeason } from "../lib/season"
import { zoneBuffOptions, zoneOwnBuff } from "./zone-buffs"

const season: GuildWarSeason | undefined = guildWarFixture[0]
const ids = (zoneId: string | null, ticked: string[] = []) =>
  zoneBuffOptions(season, zoneId, ticked).map((buff) => buff.id)

describe("zoneBuffOptions", () => {
  it("offers a Trench the Global and Regional buffs zones give, without another zone's Local one", () => {
    expect(ids("Trenches1")).toEqual([
      "EnvAngelsOfDeath_Regional",
      "EnvArmourSupplies_Regional",
      "EnvArtillerySupport_Regional",
      "EnvDefenderHealthBuff2_Global",
      "EnvFlakFire_Regional",
    ])
  })

  it("offers a Bunker its own Local buff", () => {
    expect(ids("Bunker1")).toContain("EnvFortified_Local")
  })

  it("leaves out buffs no zone gives, unless an attack already ticked one", () => {
    expect(ids("Trenches1")).not.toContain("EnvThinVeil_Global")
    expect(ids("Trenches1", ["EnvThinVeil_Global"])).toContain(
      "EnvThinVeil_Global"
    )
  })
})

describe("zoneOwnBuff", () => {
  it("is the zone's buff, or null", () => {
    expect(zoneOwnBuff(season, "Armoury")).toBe("EnvArmourSupplies_Regional")
    expect(zoneOwnBuff(season, "Trenches1")).toBeNull()
    expect(zoneOwnBuff(season, null)).toBeNull()
  })
})

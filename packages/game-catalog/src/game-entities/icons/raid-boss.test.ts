import { describe, expect, it } from "vitest"

import {
  fieldNpcIcon,
  raidBossPortrait,
  raidBossSplashPortrait,
} from "./raid-boss"

const BASE = "/game_catalog/characters"

describe("raidBossPortrait", () => {
  it("resolves a mapped boss id to its ported asset", () => {
    expect(raidBossPortrait("GuildBoss4Boss1OrksGhazghkull")).toBe(
      `${BASE}/ui_image_RoundPortrait_guild_ghazghkull_01.png`
    )
  })

  it("resolves a mapped Tyranid warrior prime id", () => {
    expect(raidBossPortrait("GuildBoss1MiniBoss1TyranWarriorLeviathan")).toBe(
      `${BASE}/ui_image_RoundPortrait_tyran_warrior_01.png`
    )
  })

  it("falls back to the roster-character portrait for a playable prime", () => {
    // Delegates to characterIcon, which applies its own id -> slug overrides.
    expect(
      raidBossPortrait("GuildBoss4MiniBoss1OrksBigMek", "orksBigMek")
    ).toBe(`${BASE}/ui_image_RoundPortrait_orkss_mek_01.png`)
  })

  it("returns undefined for an unmapped id with no roster fallback", () => {
    expect(raidBossPortrait("GuildBoss99MiniBoss1WhoKnows")).toBeUndefined()
  })
})

describe("raidBossSplashPortrait", () => {
  it("resolves the full splash portrait by GuildBoss{N} prefix", () => {
    expect(raidBossSplashPortrait("GuildBoss4Boss1OrksGhazghkull")).toBe(
      `${BASE}/ui_image_portrait_guild_ghazghkull_01.png`
    )
  })

  it("returns undefined for a prefix with no full portrait", () => {
    expect(raidBossSplashPortrait("GuildBoss99Boss1Nope")).toBeUndefined()
  })
})

describe("fieldNpcIcon", () => {
  it("resolves a mapped field-npc id to its ported asset", () => {
    expect(fieldNpcIcon({ id: "GuildBoss6Npc1TyranHormagaunt" })).toBe(
      `${BASE}/ui_image_RoundPortrait_tyran_hormagaunt_01.png`
    )
  })

  it("falls back to the questUnitId's character portrait", () => {
    expect(
      fieldNpcIcon({
        id: "GuildBoss1Npc1TyranTermagant",
        questUnitId: "tyranNpc3Termagant",
      })
    ).toBe(`${BASE}/ui_image_RoundPortrait_tyran_npc3_termagant_01.png`)
  })

  it("returns undefined with no override and no questUnitId", () => {
    expect(fieldNpcIcon({ id: "GuildBoss1Npc9Unknown" })).toBeUndefined()
  })
})

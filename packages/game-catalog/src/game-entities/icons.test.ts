import { describe, expect, it } from "vitest"

import {
  campaignDescriptor,
  damageTypeIcon,
  equipmentSlotIcon,
  progressionVisual,
  statIcon,
  traitIcon,
} from "./icons"

describe("campaignDescriptor", () => {
  it("describes standard campaigns with a standard/elite token, keyed by the base groupId", () => {
    expect(campaignDescriptor("indomitus", "standard")).toEqual({
      nameKey: "indomitus",
      difficultyToken: "standard",
      isMirror: false,
      isEvent: false,
      challenge: false,
    })
    expect(campaignDescriptor("indomitus", "elite")).toEqual({
      nameKey: "indomitus",
      difficultyToken: "elite",
      isMirror: false,
      isEvent: false,
      challenge: false,
    })
    expect(campaignDescriptor("fall-of-cadia", "standard")).toEqual({
      nameKey: "fall-of-cadia",
      difficultyToken: "standard",
      isMirror: false,
      isEvent: false,
      challenge: false,
    })
  })

  it("strips the '-mirror' suffix from the nameKey and flags isMirror", () => {
    expect(campaignDescriptor("indomitus-mirror", "standard")).toEqual({
      nameKey: "indomitus",
      difficultyToken: "standard",
      isMirror: true,
      isEvent: false,
      challenge: false,
    })
    expect(campaignDescriptor("fall-of-cadia-mirror", "elite")).toEqual({
      nameKey: "fall-of-cadia",
      difficultyToken: "elite",
      isMirror: true,
      isEvent: false,
      challenge: false,
    })
  })

  it("describes event campaigns by groupId, with a per-difficulty token and challenge flag", () => {
    expect(
      campaignDescriptor("death-guard-vs-admech", "eventStandard")
    ).toEqual({
      nameKey: "death-guard-vs-admech",
      difficultyToken: "eventStandard",
      isMirror: false,
      isEvent: true,
      challenge: false,
    })
    expect(
      campaignDescriptor("death-guard-vs-admech", "eventExtremisChallenge")
    ).toEqual({
      nameKey: "death-guard-vs-admech",
      difficultyToken: "eventExtremisChallenge",
      isMirror: false,
      isEvent: true,
      challenge: true,
    })
  })

  it("returns undefined for an unrecognized group or difficulty", () => {
    expect(campaignDescriptor("unknown-group", "standard")).toBeUndefined()
    expect(
      campaignDescriptor("death-guard-vs-admech", "unknown")
    ).toBeUndefined()
  })
})

describe("traitIcon", () => {
  it("converts a simple PascalCase trait id to its snake_case filename", () => {
    expect(traitIcon("Healer")).toBe(
      "/snowprint_assets/traits/ui_icon_trait_healer_01.png"
    )
    expect(traitIcon("ActOfFaith")).toBe(
      "/snowprint_assets/traits/ui_icon_trait_act_of_faith_01.png"
    )
    expect(traitIcon("ShadowInTheWarp")).toBe(
      "/snowprint_assets/traits/ui_icon_trait_shadow_in_the_warp_01.png"
    )
  })

  it("uses the override map for irregular trait filenames", () => {
    expect(traitIcon("Psyker")).toBe(
      "/snowprint_assets/traits/ui_icon_trait_psychic_01.png"
    )
    expect(traitIcon("LivingMetal")).toBe(
      "/snowprint_assets/traits/ui_icon_trait_livingmetall_01.png"
    )
    expect(traitIcon("Unstoppable")).toBe(
      "/snowprint_assets/traits/ui_icon_trait_unknown_01.png"
    )
  })
})

describe("damageTypeIcon", () => {
  it("builds the icon path directly from the PascalCase damage type id", () => {
    expect(damageTypeIcon("Physical")).toBe(
      "/snowprint_assets/damage_icons/ui_icon_damage_profile2_Physical.png"
    )
    expect(damageTypeIcon("HeavyRound")).toBe(
      "/snowprint_assets/damage_icons/ui_icon_damage_profile2_HeavyRound.png"
    )
  })
})

describe("equipmentSlotIcon", () => {
  it("maps a known slot code to its icon path", () => {
    expect(equipmentSlotIcon("I_Crit")).toBe(
      "/snowprint_assets/equipment/ui_icon_itemtype_crit.png"
    )
  })

  it("returns undefined for an unrecognized slot", () => {
    expect(equipmentSlotIcon("I_Unknown")).toBeUndefined()
  })
})

describe("statIcon", () => {
  it("returns a stat_icons path for each known stat kind", () => {
    expect(statIcon("health")).toBe(
      "/snowprint_assets/stat_icons/ui_icon_stat_health_01.png"
    )
    expect(statIcon("movement")).toBe(
      "/snowprint_assets/stat_icons/ui_icon_stat_move_01.png"
    )
  })
})

describe("progressionVisual", () => {
  it("renders no icon for None", () => {
    expect(progressionVisual("None")).toEqual({ kind: "none" })
  })

  it("renders gold stars for the first five steps", () => {
    expect(progressionVisual("OneStar")).toEqual({
      kind: "stars",
      icon: "/icons/stars/gold.png",
      count: 1,
    })
    expect(progressionVisual("FiveStars")).toEqual({
      kind: "stars",
      icon: "/icons/stars/gold.png",
      count: 5,
    })
  })

  it("renders red stars for the next five steps", () => {
    expect(progressionVisual("RedOneStar")).toEqual({
      kind: "stars",
      icon: "/icons/stars/red.png",
      count: 1,
    })
    expect(progressionVisual("RedFiveStars")).toEqual({
      kind: "stars",
      icon: "/icons/stars/red.png",
      count: 5,
    })
  })

  it("renders blue stars for the next three steps", () => {
    expect(progressionVisual("OneBlueStar")).toEqual({
      kind: "stars",
      icon: "/snowprint_assets/stars/ui_icon_star_legendary_large.png",
      count: 1,
    })
    expect(progressionVisual("ThreeBlueStars")).toEqual({
      kind: "stars",
      icon: "/snowprint_assets/stars/ui_icon_star_legendary_large.png",
      count: 3,
    })
  })

  it("renders a single wings icon for the max step", () => {
    expect(progressionVisual("MythicWings")).toEqual({
      kind: "wings",
      icon: "/snowprint_assets/stars/ui_icon_star_mythic.png",
    })
  })
})

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
  it("describes storyline groups with a standard/elite token, keyed by the storyline name", () => {
    expect(campaignDescriptor("campaign1", "Standard")).toEqual({
      nameKey: "indomitus",
      difficultyToken: "standard",
      isMirror: false,
      isEvent: false,
      challenge: false,
    })
    expect(campaignDescriptor("elite1", "Elite")).toEqual({
      nameKey: "indomitus",
      difficultyToken: "elite",
      isMirror: false,
      isEvent: false,
      challenge: false,
    })
    expect(campaignDescriptor("campaign2", "Standard")).toEqual({
      nameKey: "fall-of-cadia",
      difficultyToken: "standard",
      isMirror: false,
      isEvent: false,
      challenge: false,
    })
  })

  it("flags isMirror for the mirror/eliteMirror groups, keyed by the same storyline name", () => {
    expect(campaignDescriptor("mirror1", "Mirror")).toEqual({
      nameKey: "indomitus",
      difficultyToken: "standard",
      isMirror: true,
      isEvent: false,
      challenge: false,
    })
    expect(campaignDescriptor("eliteMirror2", "EliteMirror")).toEqual({
      nameKey: "fall-of-cadia",
      difficultyToken: "elite",
      isMirror: true,
      isEvent: false,
      challenge: false,
    })
  })

  it("describes event campaigns by groupId, with a per-type token and challenge flag", () => {
    expect(campaignDescriptor("eventCampaign1", "Standard")).toEqual({
      nameKey: "death-guard-vs-admech",
      difficultyToken: "eventStandard",
      isMirror: false,
      isEvent: true,
      challenge: false,
    })
    // The `challenge` flag is now a separate battle-level field (not folded into the type
    // string); the caller uses it to append "B" to node numbers, and both tiers reuse the base
    // Standard/Extremis asset.
    expect(campaignDescriptor("eventCampaign1", "Extremis", true)).toEqual({
      nameKey: "death-guard-vs-admech",
      difficultyToken: "eventExtremis",
      isMirror: false,
      isEvent: true,
      challenge: true,
    })
  })

  it("returns undefined for an unrecognized group or type", () => {
    expect(campaignDescriptor("unknown-group", "Standard")).toBeUndefined()
    expect(campaignDescriptor("eventCampaign1", "Unknown")).toBeUndefined()
    expect(campaignDescriptor("campaign5", "Standard")).toBeUndefined()
  })
})

describe("traitIcon", () => {
  it("converts a simple PascalCase trait id to its snake_case filename", () => {
    expect(traitIcon("Healer")).toBe(
      "/game_catalog/traits/ui_icon_trait_healer_01.png"
    )
    expect(traitIcon("ActOfFaith")).toBe(
      "/game_catalog/traits/ui_icon_trait_act_of_faith_01.png"
    )
    expect(traitIcon("ShadowInTheWarp")).toBe(
      "/game_catalog/traits/ui_icon_trait_shadow_in_the_warp_01.png"
    )
  })

  it("uses the override map for irregular trait filenames", () => {
    expect(traitIcon("Psyker")).toBe(
      "/game_catalog/traits/ui_icon_trait_psychic_01.png"
    )
    expect(traitIcon("LivingMetal")).toBe(
      "/game_catalog/traits/ui_icon_trait_livingmetall_01.png"
    )
    expect(traitIcon("Unstoppable")).toBe(
      "/game_catalog/traits/ui_icon_trait_unknown_01.png"
    )
  })
})

describe("damageTypeIcon", () => {
  it("builds the icon path directly from the PascalCase damage type id", () => {
    expect(damageTypeIcon("Physical")).toBe(
      "/game_catalog/damage_icons/ui_icon_damage_profile2_Physical.png"
    )
    expect(damageTypeIcon("HeavyRound")).toBe(
      "/game_catalog/damage_icons/ui_icon_damage_profile2_HeavyRound.png"
    )
  })
})

describe("equipmentSlotIcon", () => {
  it("maps a known slot code to its icon path", () => {
    expect(equipmentSlotIcon("I_Crit")).toBe(
      "/game_catalog/equipment/ui_icon_itemtype_crit.png"
    )
  })

  it("returns undefined for an unrecognized slot", () => {
    expect(equipmentSlotIcon("I_Unknown")).toBeUndefined()
  })
})

describe("statIcon", () => {
  it("returns a stat_icons path for each known stat kind", () => {
    expect(statIcon("health")).toBe(
      "/game_catalog/stat_icons/ui_icon_stat_health_01.png"
    )
    expect(statIcon("movement")).toBe(
      "/game_catalog/stat_icons/ui_icon_stat_move_01.png"
    )
  })
})

describe("progressionVisual", () => {
  it("renders no icon for None", () => {
    expect(progressionVisual("Common:None")).toEqual({ kind: "none" })
  })

  it("renders gold stars for the first five steps", () => {
    expect(progressionVisual("Common:OneStar")).toEqual({
      kind: "stars",
      icon: "/game_catalog/stars/gold.png",
      count: 1,
    })
    expect(progressionVisual("Rare:FiveStars")).toEqual({
      kind: "stars",
      icon: "/game_catalog/stars/gold.png",
      count: 5,
    })
  })

  it("renders red stars for the next five steps", () => {
    expect(progressionVisual("Rare:RedOneStar")).toEqual({
      kind: "stars",
      icon: "/game_catalog/stars/red.png",
      count: 1,
    })
    expect(progressionVisual("Legendary:RedFiveStars")).toEqual({
      kind: "stars",
      icon: "/game_catalog/stars/red.png",
      count: 5,
    })
  })

  it("renders blue stars for the next three steps", () => {
    expect(progressionVisual("Legendary:OneBlueStar")).toEqual({
      kind: "stars",
      icon: "/game_catalog/stars/ui_icon_star_legendary_large.png",
      count: 1,
    })
    expect(progressionVisual("Mythic:ThreeBlueStars")).toEqual({
      kind: "stars",
      icon: "/game_catalog/stars/ui_icon_star_legendary_large.png",
      count: 3,
    })
  })

  it("renders a single wings icon for the max step", () => {
    expect(progressionVisual("Mythic:MythicWings")).toEqual({
      kind: "wings",
      icon: "/game_catalog/stars/ui_icon_star_mythic.png",
    })
  })
})

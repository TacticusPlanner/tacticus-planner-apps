import { describe, expect, it } from "vitest"

import {
  campaignLabel,
  campaignShortLabel,
  damageTypeIcon,
  damageTypeLabel,
  equipmentSlotIcon,
  equipmentSlotLabel,
  statIcon,
  traitIcon,
} from "./icons"

describe("campaignLabel", () => {
  it("labels standard campaigns with an explicit difficulty word", () => {
    expect(campaignLabel("indomitus", "standard")).toBe("Indomitus Standard")
    expect(campaignLabel("indomitus", "elite")).toBe("Indomitus Elite")
    expect(campaignLabel("fall-of-cadia", "standard")).toBe(
      "Fall of Cadia Standard"
    )
    expect(campaignLabel("fall-of-cadia", "elite")).toBe("Fall of Cadia Elite")
  })

  it("omits the redundant 'Standard' word for a mirror group's base tier", () => {
    expect(campaignLabel("indomitus-mirror", "standard")).toBe(
      "Indomitus Mirror"
    )
    expect(campaignLabel("fall-of-cadia-mirror", "standard")).toBe(
      "Fall of Cadia Mirror"
    )
  })

  it("still appends 'Elite' for a mirror group's elite tier", () => {
    expect(campaignLabel("indomitus-mirror", "elite")).toBe(
      "Indomitus Mirror Elite"
    )
    expect(campaignLabel("fall-of-cadia-mirror", "elite")).toBe(
      "Fall of Cadia Mirror Elite"
    )
  })

  it("labels event campaigns by defending faction + difficulty, using in-game faction names", () => {
    expect(campaignLabel("death-guard-vs-admech", "eventStandard")).toBe(
      "Adeptus Mechanicus Standard"
    )
    expect(campaignLabel("death-guard-vs-admech", "eventExtremis")).toBe(
      "Adeptus Mechanicus Extremis"
    )
    // Differs from the shipped asset filenames ("T'au Empire", "Adeptus Sororitas").
    expect(campaignLabel("genestealers-vs-tau-empire", "eventStandard")).toBe(
      "T'au Standard"
    )
    expect(
      campaignLabel("world-eaters-vs-adepta-sororitas", "eventExtremis")
    ).toBe("Adepta Sororitas Extremis")
  })

  it("returns undefined for an unrecognized group or difficulty", () => {
    expect(campaignLabel("unknown-group", "standard")).toBeUndefined()
    expect(campaignLabel("death-guard-vs-admech", "unknown")).toBeUndefined()
  })
})

describe("campaignShortLabel", () => {
  it("codes standard campaign tiers as S/E", () => {
    expect(campaignShortLabel("fall-of-cadia", "standard")).toEqual({
      name: "Fall of Cadia",
      code: "S",
      challenge: false,
    })
    expect(campaignShortLabel("fall-of-cadia", "elite")).toEqual({
      name: "Fall of Cadia",
      code: "E",
      challenge: false,
    })
  })

  it("prefixes mirror groups with M, dropping the redundant 'Mirror' word from the name", () => {
    expect(campaignShortLabel("indomitus-mirror", "standard")).toEqual({
      name: "Indomitus",
      code: "MS",
      challenge: false,
    })
    expect(campaignShortLabel("indomitus-mirror", "elite")).toEqual({
      name: "Indomitus",
      code: "ME",
      challenge: false,
    })
  })

  it("codes event tiers as S/Ext and flags Challenge difficulties", () => {
    expect(
      campaignShortLabel("death-guard-vs-admech", "eventStandard")
    ).toEqual({
      name: "Adeptus Mechanicus",
      code: "S",
      challenge: false,
    })
    expect(
      campaignShortLabel("death-guard-vs-admech", "eventStandardChallenge")
    ).toEqual({ name: "Adeptus Mechanicus", code: "S", challenge: true })
    expect(
      campaignShortLabel("death-guard-vs-admech", "eventExtremisChallenge")
    ).toEqual({ name: "Adeptus Mechanicus", code: "Ext", challenge: true })
  })

  it("returns undefined for an unrecognized group or difficulty", () => {
    expect(campaignShortLabel("unknown-group", "standard")).toBeUndefined()
    expect(
      campaignShortLabel("death-guard-vs-admech", "unknown")
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

describe("damageTypeIcon / damageTypeLabel", () => {
  it("builds the icon path directly from the PascalCase damage type id", () => {
    expect(damageTypeIcon("Physical")).toBe(
      "/snowprint_assets/damage_icons/ui_icon_damage_profile2_Physical.png"
    )
    expect(damageTypeIcon("HeavyRound")).toBe(
      "/snowprint_assets/damage_icons/ui_icon_damage_profile2_HeavyRound.png"
    )
  })

  it("derives a spaced label from the PascalCase id", () => {
    expect(damageTypeLabel("HeavyRound")).toBe("Heavy Round")
    expect(damageTypeLabel("Physical")).toBe("Physical")
  })
})

describe("equipmentSlotIcon / equipmentSlotLabel", () => {
  it("maps known slot codes to their icon and label", () => {
    expect(equipmentSlotIcon("I_Crit")).toBe(
      "/snowprint_assets/equipment/ui_icon_itemtype_crit.png"
    )
    expect(equipmentSlotLabel("I_Booster_Crit")).toBe("Crit Booster")
  })

  it("falls back to the raw code for an unrecognized slot", () => {
    expect(equipmentSlotIcon("I_Unknown")).toBeUndefined()
    expect(equipmentSlotLabel("I_Unknown")).toBe("I_Unknown")
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

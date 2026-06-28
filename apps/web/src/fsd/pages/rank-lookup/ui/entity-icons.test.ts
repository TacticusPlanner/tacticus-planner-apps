import { describe, expect, it } from "vitest"

import { campaignIcon } from "@/entities/campaign"
import { characterIcon } from "@/entities/character"
import { rankIcon } from "@/entities/rank"
import { upgradeIcon } from "@/entities/upgrade"

describe("entity icon mapping", () => {
  it("maps rank ids to asset paths, including Adamantine via the mythical icons", () => {
    expect(rankIcon("Stone1")).toBe("/snowprint_assets/ranks/stone1.png")
    expect(rankIcon("Diamond3")).toBe("/snowprint_assets/ranks/diamond3.png")
    expect(rankIcon("Adamantine1")).toBe(
      "/snowprint_assets/ranks/ui_icon_rank_mythical_01.png"
    )
    expect(rankIcon("Adamantine3")).toBe(
      "/snowprint_assets/ranks/ui_icon_rank_mythical_03.png"
    )
  })

  it("derives the upgrade-material icon from the upgrade id", () => {
    expect(upgradeIcon("upgArmC001")).toBe(
      "/snowprint_assets/upgrade_materials/ui_icon_upgrade_upgArmC001.png"
    )
  })

  it("maps standard campaigns by id+difficulty and leaves events unmapped", () => {
    expect(campaignIcon("indomitus", "standard")).toBe(
      "/snowprint_assets/campaigns/Indomitus.png"
    )
    expect(campaignIcon("indomitus", "elite")).toBe(
      "/snowprint_assets/campaigns/Indomitus Elite.png"
    )
    expect(campaignIcon("indomitus-mirror", "mirror")).toBe(
      "/snowprint_assets/campaigns/Indomitus Mirror.png"
    )
    expect(
      campaignIcon("death-guard-vs-admech", "eventStandard")
    ).toBeUndefined()
  })

  it("resolves character round-icons from the generated map", () => {
    expect(characterIcon("astarCyrus")).toMatch(/RoundPortrait_astar_cyrus/)
    expect(characterIcon("not-a-real-id")).toBeUndefined()
  })
})

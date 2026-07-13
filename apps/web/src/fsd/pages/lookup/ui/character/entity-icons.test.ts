import { describe, expect, it } from "vitest"

import {
  campaignIcon,
  characterIcon,
  rankIcon,
  UpgradeIcons,
} from "@workspace/game-catalog"
import {
  campaignIdSchema,
  unitIdSchema,
  upgradeIdSchema,
} from "@workspace/game-domain"

describe("entity icon mapping", () => {
  it("maps rank ids to asset paths using lowercase Rank filenames", () => {
    expect(rankIcon("Stone1")).toBe("/game_catalog/ranks/stone1.png")
    expect(rankIcon("Diamond3")).toBe("/game_catalog/ranks/diamond3.png")
    expect(rankIcon("Adamantine1")).toBe("/game_catalog/ranks/adamantine1.png")
    expect(rankIcon("Adamantine2")).toBe("/game_catalog/ranks/adamantine2.png")
  })

  it("derives the upgrade-material icon from the upgrade id", () => {
    expect(UpgradeIcons.icon(upgradeIdSchema.parse("upgArmC001"))).toBe(
      "/game_catalog/upgrade_materials/ui_icon_upgrade_upgArmC001.png"
    )
  })

  it("maps storyline groups by groupId+type", () => {
    expect(campaignIcon(campaignIdSchema.parse("campaign1"), "Standard")).toBe(
      "/game_catalog/campaigns/indomitus-standard.png"
    )
    expect(campaignIcon(campaignIdSchema.parse("elite1"), "Elite")).toBe(
      "/game_catalog/campaigns/indomitus-elite.png"
    )
    expect(campaignIcon(campaignIdSchema.parse("mirror1"), "Mirror")).toBe(
      "/game_catalog/campaigns/indomitus-mirror-standard.png"
    )
    expect(
      campaignIcon(campaignIdSchema.parse("eliteMirror1"), "EliteMirror")
    ).toBe("/game_catalog/campaigns/indomitus-mirror-elite.png")
  })

  it("maps event campaigns to the defending-faction asset, challenge tiers reuse the base image", () => {
    expect(
      campaignIcon(campaignIdSchema.parse("eventCampaign1"), "Standard")
    ).toBe("/game_catalog/campaigns/death-guard-vs-admech-eventStandard.png")
    expect(
      campaignIcon(campaignIdSchema.parse("eventCampaign1"), "Extremis")
    ).toBe("/game_catalog/campaigns/death-guard-vs-admech-eventExtremis.png")
    expect(
      campaignIcon(campaignIdSchema.parse("eventCampaign1"), "Standard", true)
    ).toBe("/game_catalog/campaigns/death-guard-vs-admech-eventStandard.png")
    expect(
      campaignIcon(campaignIdSchema.parse("eventCampaign99"), "Standard")
    ).toBeUndefined()
  })

  it("derives character round-icons from camelCase id via snake_case slug", () => {
    expect(characterIcon(unitIdSchema.parse("astarCyrus"))).toMatch(
      /RoundPortrait_astar_cyrus/
    )
    // Unknown ids still derive a path (runtime 404 is handled by EntityIcon fallback).
    expect(characterIcon(unitIdSchema.parse("notARealId"))).toMatch(
      /RoundPortrait_not_a_real_id/
    )
  })
})

import { describe, expect, it } from "vitest"

import {
  campaignIcon,
  characterIcon,
  rankIcon,
  UpgradeIcons,
} from "@workspace/game-catalog"

describe("entity icon mapping", () => {
  it("maps rank ids to asset paths using lowercase Rank filenames", () => {
    expect(rankIcon("Stone1")).toBe("/snowprint_assets/ranks/stone1.png")
    expect(rankIcon("Diamond3")).toBe("/snowprint_assets/ranks/diamond3.png")
    expect(rankIcon("Adamantine1")).toBe(
      "/snowprint_assets/ranks/adamantine1.png"
    )
    expect(rankIcon("Adamantine3")).toBe(
      "/snowprint_assets/ranks/adamantine3.png"
    )
  })

  it("derives the upgrade-material icon from the upgrade id", () => {
    expect(UpgradeIcons.icon("upgArmC001")).toBe(
      "/snowprint_assets/upgrade_materials/ui_icon_upgrade_upgArmC001.png"
    )
  })

  it("maps storyline groups by groupId+type", () => {
    expect(campaignIcon("campaign1", "Standard")).toBe(
      "/snowprint_assets/campaigns/indomitus-standard.png"
    )
    expect(campaignIcon("elite1", "Elite")).toBe(
      "/snowprint_assets/campaigns/indomitus-elite.png"
    )
    expect(campaignIcon("mirror1", "Mirror")).toBe(
      "/snowprint_assets/campaigns/indomitus-mirror-standard.png"
    )
    expect(campaignIcon("eliteMirror1", "EliteMirror")).toBe(
      "/snowprint_assets/campaigns/indomitus-mirror-elite.png"
    )
  })

  it("maps event campaigns to the defending-faction asset, challenge tiers reuse the base image", () => {
    expect(campaignIcon("eventCampaign1", "Standard")).toBe(
      "/snowprint_assets/campaigns/death-guard-vs-admech-eventStandard.png"
    )
    expect(campaignIcon("eventCampaign1", "Extremis")).toBe(
      "/snowprint_assets/campaigns/death-guard-vs-admech-eventExtremis.png"
    )
    expect(campaignIcon("eventCampaign1", "Standard", true)).toBe(
      "/snowprint_assets/campaigns/death-guard-vs-admech-eventStandard.png"
    )
    expect(campaignIcon("eventCampaign99", "Standard")).toBeUndefined()
  })

  it("derives character round-icons from camelCase id via snake_case slug", () => {
    expect(characterIcon("astarCyrus")).toMatch(/RoundPortrait_astar_cyrus/)
    // Unknown ids still derive a path (runtime 404 is handled by EntityIcon fallback).
    expect(characterIcon("notARealId")).toMatch(/RoundPortrait_not_a_real_id/)
  })
})

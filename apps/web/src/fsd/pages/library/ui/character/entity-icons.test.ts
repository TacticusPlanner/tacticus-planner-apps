import { describe, expect, it } from "vitest"

import {
  campaignIcon,
  characterIcon,
  onslaughtAllianceIcon,
  onslaughtTierIcon,
  rankIcon,
  UpgradeIcons,
} from "@workspace/game-catalog"
import {
  campaignIdSchema,
  unitIdSchema,
  upgradeIdSchema,
} from "@workspace/game-domain"

describe("entity icon mapping", () => {
  it("maps rank ids to the game's rank badges, numbered in ladder order", () => {
    expect(rankIcon("Stone1")).toBe("/game_catalog/datamines/fonts/Rank_0.webp")
    expect(rankIcon("Silver3")).toBe(
      "/game_catalog/datamines/fonts/IdunTextRRank_11.webp"
    )
    expect(rankIcon("Diamond3")).toBe(
      "/game_catalog/datamines/fonts/Rank_17.webp"
    )
    expect(rankIcon("Adamantine1")).toBe(
      "/game_catalog/datamines/fonts/Rank_18.webp"
    )
    expect(rankIcon("Adamantine2")).toBe(
      "/game_catalog/datamines/fonts/Rank_19.webp"
    )
  })

  it("maps Onslaught progress and alliance markers to game sprites", () => {
    expect(onslaughtTierIcon("Diamond", 4)).toBe(
      "/game_catalog/datamines/atlases/ui_onslaught_button_rank_diamond_4.webp"
    )
    expect(onslaughtAllianceIcon("Xenos")).toBe(
      "/game_catalog/datamines/atlases/ui_ability_badges_xenos.webp"
    )
  })

  it("derives the upgrade-material icon from the upgrade id", () => {
    expect(UpgradeIcons.icon(upgradeIdSchema.parse("upgArmC001"))).toBe(
      "/game_catalog/datamines/upgrades/ui_icon_upgrade_upgArmC001.webp"
    )
  })

  it("maps storyline groups by groupId+type", () => {
    expect(campaignIcon(campaignIdSchema.parse("campaign1"), "Standard")).toBe(
      "/game_catalog/datamines/atlases/ui_icon_campaign_01.webp"
    )
    expect(campaignIcon(campaignIdSchema.parse("elite1"), "Elite")).toBe(
      "/game_catalog/datamines/atlases/ui_icon_campaign_01_elite.webp"
    )
    expect(campaignIcon(campaignIdSchema.parse("mirror1"), "Mirror")).toBe(
      "/game_catalog/datamines/atlases/ui_icon_campaign_01_mirror.webp"
    )
    expect(
      campaignIcon(campaignIdSchema.parse("eliteMirror1"), "EliteMirror")
    ).toBe(
      "/game_catalog/datamines/atlases/ui_icon_campaign_01_mirror_elite.webp"
    )
  })

  it("maps event campaigns to the defending-faction asset, challenge tiers reuse the base image", () => {
    expect(
      campaignIcon(campaignIdSchema.parse("eventCampaign1"), "Standard")
    ).toBe(
      "/game_catalog/datamines/atlases/ui_icon_faction_adeptus_mechanicus_01.webp"
    )
    expect(
      campaignIcon(campaignIdSchema.parse("eventCampaign1"), "Extremis")
    ).toBe(
      "/game_catalog/curated/campaigns/death-guard-vs-admech-eventExtremis.webp"
    )
    expect(
      campaignIcon(campaignIdSchema.parse("eventCampaign1"), "Standard", true)
    ).toBe(
      "/game_catalog/datamines/atlases/ui_icon_faction_adeptus_mechanicus_01.webp"
    )
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

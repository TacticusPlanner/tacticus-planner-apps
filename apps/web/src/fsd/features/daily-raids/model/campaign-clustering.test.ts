import { battleIdSchema } from "@workspace/game-domain"
import { describe, expect, it } from "vitest"

import { clusterByCampaign, upgradeCampaignKey } from "./campaign-clustering"

type Upgrade = { id: string; campaign?: string; energy?: number }

const order = (upgrades: Upgrade[]) =>
  clusterByCampaign(
    upgrades,
    (upgrade) => upgrade.campaign,
    (upgrade) => upgrade.energy
  ).map((upgrade) => upgrade.id)

describe("clusterByCampaign", () => {
  it("pulls a later same-campaign upgrade within 50 energy up next to the earlier one", () => {
    expect(
      order([
        { id: "A", campaign: "indomitus-elite", energy: 120 },
        { id: "B", campaign: "cadia", energy: 110 },
        { id: "C", campaign: "indomitus-elite", energy: 75 },
        { id: "D", campaign: "cadia", energy: 65 },
        { id: "E", campaign: "indomitus-elite", energy: 30 },
      ])
    ).toEqual(["A", "C", "B", "D", "E"])
  })

  it("leaves an upgrade more than 50 energy away in place", () => {
    expect(
      order([
        { id: "A", campaign: "indomitus-elite", energy: 120 },
        { id: "B", campaign: "cadia", energy: 110 },
        { id: "C", campaign: "indomitus-elite", energy: 65 },
      ])
    ).toEqual(["A", "B", "C"])
  })

  it("measures from the upgrade doing the pulling, without chaining", () => {
    expect(
      order([
        { id: "A", campaign: "indomitus-elite", energy: 200 },
        { id: "B", campaign: "cadia", energy: 180 },
        { id: "C", campaign: "indomitus-elite", energy: 160 },
        { id: "D", campaign: "indomitus-elite", energy: 140 },
      ])
    ).toEqual(["A", "C", "B", "D"])
  })

  it("treats each campaign difficulty and mirror as its own campaign", () => {
    expect(
      order([
        { id: "A", campaign: "indomitus-elite", energy: 120 },
        { id: "B", campaign: "indomitus-mirror-elite", energy: 110 },
        { id: "C", campaign: "indomitus-elite", energy: 80 },
        { id: "D", campaign: "indomitus", energy: 75 },
      ])
    ).toEqual(["A", "C", "B", "D"])
  })

  it("keeps an upgrade with no campaign or energy in place", () => {
    expect(
      order([
        { id: "A", campaign: "indomitus", energy: 100 },
        { id: "B", energy: 90 },
        { id: "C", campaign: "indomitus" },
        { id: "D", campaign: "indomitus", energy: 80 },
      ])
    ).toEqual(["A", "D", "B", "C"])
  })
})

describe("upgradeCampaignKey", () => {
  it("uses the campaign of the first planned location", () => {
    const b1 = battleIdSchema.parse("B1")
    const b2 = battleIdSchema.parse("B2")
    const location = (id: string, campaignKey: string) => ({
      id,
      campaignKey,
      campaignName: id,
      nodeLabel: "",
      shortLabel: id,
      challenge: false,
    })
    const locations = new Map([
      [b1, location("B1", "indomitus:Elite")],
      [b2, location("B2", "cadia:Standard")],
    ])

    expect(
      upgradeCampaignKey([{ battleId: b2 }, { battleId: b1 }], locations)
    ).toBe("cadia:Standard")
    expect(upgradeCampaignKey([], locations)).toBeUndefined()
  })
})

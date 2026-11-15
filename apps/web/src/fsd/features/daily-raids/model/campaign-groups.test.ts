import type { BattleId } from "@workspace/game-domain"
import { describe, expect, it } from "vitest"

import {
  groupConsecutiveByCampaign,
  groupRowsByUpgradeCampaign,
  groupScheduleByCampaign,
  locationNodeNumber,
} from "./campaign-groups"

// Battle id "<campaign>:<node>": the campaign is the part before the colon.
const battle = (id: string) => id as BattleId
const campaignOf = (battleId: BattleId) => battleId.split(":")[0] || undefined

type Entry = { battleId: BattleId }
const resource = (resourceId: string, ...battles: string[]) => ({
  resourceId,
  entries: battles.map((id): Entry => ({ battleId: battle(id) })),
})

const shape = (groups: ReturnType<typeof groupScheduleByCampaign<Entry>>) =>
  groups.map((group) => ({
    campaign: group.campaignKey,
    rows: group.items.map(
      ({ resourceId, entry }) => `${entry.battleId}/${resourceId}`
    ),
  }))

describe("groupScheduleByCampaign", () => {
  it("puts a cluster's locations under one header per campaign, in priority order", () => {
    // The Saim-Hann upgrades of a day: four farmed at Saim-Hann Elite, three of them also at a
    // Saim-Hann Mirror Elite node; then two Indomitus Elite upgrades; then one farmed at Saim-Hann
    // Mirror Elite 27 only, which comes much later and so stays in a group of its own.
    const groups = groupScheduleByCampaign(
      [
        resource("r1", "she:38", "shme:4"),
        resource("r2", "she:37", "shme:3"),
        resource("r3", "she:36", "shme:2"),
        resource("r4", "she:22"),
        resource("r5", "ie:15"),
        resource("r6", "ie:25"),
        resource("r7", "shme:27"),
      ],
      campaignOf
    )
    expect(shape(groups)).toEqual([
      {
        campaign: "she",
        rows: ["she:38/r1", "she:37/r2", "she:36/r3", "she:22/r4"],
      },
      { campaign: "shme", rows: ["shme:4/r1", "shme:3/r2", "shme:2/r3"] },
      { campaign: "ie", rows: ["ie:15/r5", "ie:25/r6"] },
      { campaign: "shme", rows: ["shme:27/r7"] },
    ])
  })

  it("keeps an upgrade in the cluster when any of its locations is in a campaign the cluster holds", () => {
    // Saim-Hann Elite 33, then an upgrade first at Indomitus Mirror Elite 12 and also at Saim-Hann
    // Elite 11: both Saim-Hann Elite battles share one group.
    const groups = groupScheduleByCampaign(
      [
        resource("r1", "she:33"),
        resource("r2", "ime:12", "she:11"),
        resource("r3", "i:19"),
      ],
      campaignOf
    )
    expect(shape(groups)).toEqual([
      { campaign: "she", rows: ["she:33/r1", "she:11/r2"] },
      { campaign: "ime", rows: ["ime:12/r2"] },
      { campaign: "i", rows: ["i:19/r3"] },
    ])
  })

  it("joins a later cluster's group to the one right before it when the campaign is the same", () => {
    const groups = groupScheduleByCampaign(
      [resource("r1", "a:1", "b:1"), resource("r2", "b:2")],
      campaignOf
    )
    expect(shape(groups)).toEqual([
      { campaign: "a", rows: ["a:1/r1"] },
      { campaign: "b", rows: ["b:1/r1", "b:2/r2"] },
    ])
  })

  it("keeps a battle the catalog cannot place in a group of its own", () => {
    const groups = groupScheduleByCampaign(
      [resource("r1", ":1"), resource("r2", ":2")],
      campaignOf
    )
    expect(shape(groups)).toEqual([
      { campaign: undefined, rows: [":1/r1"] },
      { campaign: undefined, rows: [":2/r2"] },
    ])
  })

  it("drops hidden rows and a location listed twice for one upgrade, and keeps each row's upgrade entries", () => {
    const r1 = {
      resourceId: "r1",
      entries: [
        { battleId: battle("a:1") },
        { battleId: battle("a:2") },
        { battleId: battle("a:1") },
      ],
    }
    const groups = groupScheduleByCampaign(
      [r1],
      campaignOf,
      (entry) => entry.battleId !== battle("a:2")
    )
    expect(shape(groups)).toEqual([{ campaign: "a", rows: ["a:1/r1"] }])
    expect(groups[0]?.items[0]?.resourceEntries).toBe(r1.entries)
  })
})

describe("groupConsecutiveByCampaign", () => {
  it("groups runs of one campaign without reordering", () => {
    const groups = groupConsecutiveByCampaign(
      ["ome:26", "ime:7", "ime:38", "ome:15", "ome:21", "ome:39", ":x", ":y"],
      (id) => campaignOf(battle(id)),
      (id) => id
    )
    expect(groups.map((group) => group.items)).toEqual([
      ["ome:26"],
      ["ime:7", "ime:38"],
      ["ome:15", "ome:21", "ome:39"],
      [":x"],
      [":y"],
    ])
    expect(new Set(groups.map((group) => group.key)).size).toBe(groups.length)
  })
})

describe("groupRowsByUpgradeCampaign", () => {
  it("groups a flat list the way Today groups the same upgrades", () => {
    const row = (battleId: string, resourceId: string) => ({
      battleId: battle(battleId),
      resourceId,
    })
    const groups = groupRowsByUpgradeCampaign(
      [
        row("she:33", "r1"),
        row("ime:12", "r2"),
        row("she:11", "r2"),
        row("i:19", "r3"),
      ],
      campaignOf
    )
    expect(
      groups.map((group) => group.items.map((item) => item.battleId))
    ).toEqual([["she:33", "she:11"], ["ime:12"], ["i:19"]])
  })
})

describe("locationNodeNumber", () => {
  it("drops the difficulty word", () => {
    expect(
      locationNodeNumber({ nodeLabel: "Elite 36", difficultyLabel: "Elite" })
    ).toBe("36")
    expect(locationNodeNumber({ nodeLabel: "12B" })).toBe("12B")
    expect(locationNodeNumber({ nodeLabel: "" })).toBeUndefined()
  })
})

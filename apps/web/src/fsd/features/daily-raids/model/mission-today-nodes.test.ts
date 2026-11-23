import { describe, expect, it } from "vitest"
import type { BattleId } from "@workspace/game-domain"

import { missionTodayNodes } from "./mission-today-nodes"

const id = (value: string) => value as BattleId

const battles = [
  { id: "I15", campaignGroupId: "indomitus", energyCost: 5 },
  { id: "M10", campaignGroupId: "indomitusMirror", energyCost: 6 },
  { id: "E10", campaignGroupId: "indomitusElite", energyCost: 10 },
  { id: "T25B", campaignGroupId: "eventCampaign2", energyCost: 6 },
]
const eventGroups = new Set(["eventCampaign2"])

describe("missionTodayNodes", () => {
  it("has no rules without battles to go", () => {
    expect(
      missionTodayNodes(
        { battlesToGo: 0, eventOnly: false },
        battles,
        eventGroups
      )
    ).toBeUndefined()
    expect(missionTodayNodes(undefined, battles, eventGroups)).toBeUndefined()
  })

  it("keeps lightning victories to event-campaign nodes", () => {
    const rules = missionTodayNodes(
      { battlesToGo: 25, eventOnly: true },
      battles,
      eventGroups
    )
    expect(battles.map((battle) => rules?.nodeFilter?.(id(battle.id)))).toEqual(
      [false, false, false, true]
    )
    expect(rules?.preferredBattleIds).toBeUndefined()
  })

  it("prefers 5 and 6 energy nodes for campaign battles", () => {
    const rules = missionTodayNodes(
      { battlesToGo: 25, eventOnly: false },
      battles,
      eventGroups
    )
    expect(rules?.nodeFilter).toBeUndefined()
    expect([...(rules?.preferredBattleIds ?? [])]).toEqual([
      "I15",
      "M10",
      "T25B",
    ])
  })

  it("prefers the running campaign event's nodes with CE nodes first", () => {
    const ce = new Set([id("T25B")])
    expect(
      missionTodayNodes(
        { battlesToGo: 25, eventOnly: false },
        battles,
        eventGroups,
        ce
      )?.preferredBattleIds
    ).toBe(ce)
  })
})

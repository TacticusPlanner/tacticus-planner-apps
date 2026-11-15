import { describe, expect, it } from "vitest"

import { acquisitionSourceSeed } from "./acquisition-plan"

describe("acquisitionSourceSeed", () => {
  it("defaults to Campaigns-only for a goal predating this control (null sources)", () => {
    expect(acquisitionSourceSeed(null, [], [])).toEqual({
      campaignEnabled: true,
      regularBattleIds: [],
      mythicBattleIds: [],
      onslaughtEnabled: false,
      shopOfferIds: [],
    })
  })

  it("preserves an explicit all-groups-off selection (empty array) rather than re-enabling Campaigns (tacticus-planner-apps#103)", () => {
    expect(acquisitionSourceSeed([], [], [])).toEqual({
      campaignEnabled: false,
      regularBattleIds: [],
      mythicBattleIds: [],
      onslaughtEnabled: false,
      shopOfferIds: [],
    })
  })
})

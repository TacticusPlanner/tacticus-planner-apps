import { describe, expect, it } from "vitest"

import { campaignOutlook } from "./campaign-outlook"

// Indomitus: nine 3-energy nodes with a cap of 3, fifteen 5-energy nodes with a cap of 10.
const nodes = [
  ...Array.from({ length: 9 }, () => ({ energyCost: 3, dailyAttempts: 3 })),
  ...Array.from({ length: 15 }, () => ({ energyCost: 5, dailyAttempts: 10 })),
]

describe("campaignOutlook", () => {
  it("is null when no battles are left", () => {
    expect(campaignOutlook(nodes, 538, 0, 10)).toBeNull()
  })

  it("spreads the battles over the days left at the cheapest nodes", () => {
    expect(campaignOutlook(nodes, 538, 640, 10)).toEqual({
      battles: 640,
      daysLeft: 10,
      perDay: 64,
      // 27 at 3 energy, then 37 at 5 energy.
      perDayEnergy: 81 + 185,
      maxPerDay: 27 + 91,
      shortfall: 0,
    })
  })

  it("rounds partial days up and counts at least one", () => {
    expect(campaignOutlook(nodes, 538, 100, 2.4)?.daysLeft).toBe(3)
    expect(campaignOutlook(nodes, 538, 100, 0)?.daysLeft).toBe(1)
  })

  it("says how many battles cannot fit before the event ends", () => {
    const outlook = campaignOutlook(nodes, 150, 640, 4)
    // 150 energy: 27 at 3 energy (81), then 13 at 5 energy (65).
    expect(outlook?.maxPerDay).toBe(40)
    expect(outlook?.perDayEnergy).toBeNull()
    expect(outlook?.shortfall).toBe(640 - 160)
  })

  it("treats a daily energy of 0 as no limit", () => {
    expect(campaignOutlook(nodes, 0, 10, 1)?.maxPerDay).toBe(27 + 150)
  })
})

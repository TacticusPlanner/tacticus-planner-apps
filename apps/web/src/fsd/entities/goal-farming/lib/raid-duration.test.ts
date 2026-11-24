import { describe, expect, it } from "vitest"

import type { EstimateOutcome } from "../model/estimate.domain"
import { goalRaidDuration } from "./raid-duration"

const estimated = (days: number, firstRaidDay?: number): EstimateOutcome => ({
  status: "Estimated",
  days,
  date: "2026-12-01",
  energyTotal: 0,
  raidsTotal: 0,
  ...(firstRaidDay === undefined ? {} : { firstRaidDay }),
})

describe("goalRaidDuration", () => {
  it("counts the first raid day through the done day", () => {
    expect(goalRaidDuration(estimated(12, 4))).toBe(9)
  })

  it("is one day for a goal raided and done the same day", () => {
    expect(goalRaidDuration(estimated(3, 3))).toBe(1)
  })

  it("is undefined for a goal that needs no raids", () => {
    expect(goalRaidDuration(estimated(0))).toBeUndefined()
  })

  it("is undefined for a blocked or missing estimate", () => {
    expect(
      goalRaidDuration({
        status: "Blocked",
        reason: "NoFarmLocation",
        resourceIds: [],
      })
    ).toBeUndefined()
    expect(goalRaidDuration(undefined)).toBeUndefined()
  })
})

import { describe, expect, it, vi } from "vitest"

import {
  recordXpIncomeFeatureInterest,
  xpIncomeFeatureInterest,
} from "./xp-income-feature-interest"

describe("XP Income feature interest", () => {
  it("reserves the analytics contract without network or storage side effects", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch")
    const storageSpy = vi.spyOn(Storage.prototype, "setItem")

    recordXpIncomeFeatureInterest(xpIncomeFeatureInterest)

    expect(xpIncomeFeatureInterest).toEqual({
      eventName: "feature_interest_submitted",
      featureId: "xp_income",
    })
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(storageSpy).not.toHaveBeenCalled()

    fetchSpy.mockRestore()
    storageSpy.mockRestore()
  })
})

import { describe, expect, it } from "vitest"

import { survivalSeasonName } from "./survival-season-name"

describe("survivalSeasonName", () => {
  it("names a month-and-year season in the UI language", () => {
    expect(survivalSeasonName("survival_december_2026", "en")).toBe(
      "December 2026"
    )
    expect(survivalSeasonName("survival_december_2026", "de")).toBe(
      "Dezember 2026"
    )
  })

  it("has no name for any other id", () => {
    expect(survivalSeasonName("survival_crescendo_01", "en")).toBeUndefined()
    expect(survivalSeasonName("survival_smarch_2026", "en")).toBeUndefined()
  })
})

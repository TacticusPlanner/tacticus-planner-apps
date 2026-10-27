import { describe, expect, it } from "vitest"

import { toPierceRatios } from "./pierce-ratios"

describe("toPierceRatios", () => {
  it("turns the catalog's percentages into ratios by damage type id", () => {
    const ratios = toPierceRatios([
      { id: "Physical", piercingRatio: 1 },
      { id: "Plasma", piercingRatio: 65 },
      { id: "Psychic", piercingRatio: 100 },
    ])
    expect(ratios.get("Physical")).toBe(0.01)
    expect(ratios.get("Plasma")).toBe(0.65)
    expect(ratios.get("Psychic")).toBe(1)
    expect(ratios.get("NotARealType")).toBeUndefined()
  })
})

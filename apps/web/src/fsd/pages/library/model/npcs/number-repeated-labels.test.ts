import { describe, expect, it } from "vitest"

import { numberRepeatedLabels } from "./number-repeated-labels"

describe("numberRepeatedLabels", () => {
  it("leaves unique labels alone", () => {
    const options = [
      { id: "a", label: "Campaign" },
      { id: "b", label: "Legendary Event" },
    ]
    expect(numberRepeatedLabels(options)).toEqual(options)
  })

  it("numbers labels shared by several options in list order", () => {
    expect(
      numberRepeatedLabels([
        { id: "a", label: "Other" },
        { id: "b", label: "Campaign" },
        { id: "c", label: "Other" },
      ])
    ).toEqual([
      { id: "a", label: "Other 1" },
      { id: "b", label: "Campaign" },
      { id: "c", label: "Other 2" },
    ])
  })
})

import { describe, expect, it } from "vitest"

import { numberFormat } from "./format-number"

describe("numberFormat", () => {
  it("groups digits by the locale's convention", () => {
    expect(numberFormat("en").format(12_590)).toBe("12,590")
    expect(numberFormat("de").format(12_590)).toBe("12.590")
  })

  it("passes options through", () => {
    expect(numberFormat("en", { style: "percent" }).format(0.256)).toBe("26%")
    expect(numberFormat("en", { maximumFractionDigits: 2 }).format(1.236)).toBe(
      "1.24"
    )
  })

  it("reuses one format per locale and options", () => {
    expect(numberFormat("en")).toBe(numberFormat("en"))
    expect(numberFormat("en", { style: "percent" })).toBe(
      numberFormat("en", { style: "percent" })
    )
    expect(numberFormat("en")).not.toBe(numberFormat("de"))
    expect(numberFormat("en")).not.toBe(
      numberFormat("en", { style: "percent" })
    )
  })

  it("keeps the runtime default apart from an empty locale", () => {
    expect(numberFormat(undefined)).toBe(numberFormat(undefined))
    expect(() => numberFormat("")).toThrow(RangeError)
  })

  it("rejects an invalid locale or option, then still serves valid ones", () => {
    expect(() => numberFormat("en-")).toThrow(RangeError)
    expect(numberFormat("en").format(1000)).toBe("1,000")

    const style = "nope" as Intl.NumberFormatOptions["style"]
    expect(() => numberFormat("en", { style })).toThrow(RangeError)
    expect(numberFormat("en", { style: "percent" }).format(0.5)).toBe("50%")
  })
})

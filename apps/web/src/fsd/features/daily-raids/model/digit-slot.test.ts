import { describe, expect, it } from "vitest"

import { inDigitSlot } from "./digit-slot"

describe("inDigitSlot", () => {
  it("pads a one-digit value to two digits' width with a figure space", () => {
    expect(inDigitSlot(7)).toBe(" 7")
    expect(inDigitSlot(7, "end")).toBe("7 ")
  })

  it("leaves longer values as they are", () => {
    expect(inDigitSlot(38)).toBe("38")
    expect(inDigitSlot("12B")).toBe("12B")
    expect(inDigitSlot(120, "end")).toBe("120")
  })
})

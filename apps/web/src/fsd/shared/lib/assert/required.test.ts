import { describe, expect, it } from "vitest"

import { required } from "./required"

describe("required", () => {
  it("returns a present value, falsy ones included", () => {
    expect(required(0, "count")).toBe(0)
    expect(required("", "label")).toBe("")
    expect(required(false, "flag")).toBe(false)
  })

  it("throws naming the missing value", () => {
    expect(() => required(undefined, "lane alpha")).toThrow(
      "Missing lane alpha"
    )
    expect(() => required(null, "target key")).toThrow("Missing target key")
  })
})

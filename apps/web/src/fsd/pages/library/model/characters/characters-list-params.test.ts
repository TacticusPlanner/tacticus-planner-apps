import { describe, expect, it } from "vitest"

import { withoutForeignParams } from "./characters-list-params"

describe("withoutForeignParams", () => {
  it("drops the former calculator's parameters", () => {
    expect(withoutForeignParams("?rankStart=Iron1&rankEnd=Gold1")).toBe("")
  })

  it("keeps the unit filters' parameters", () => {
    expect(withoutForeignParams("?trait=Psyker&rankStart=Iron1")).toBe(
      "?trait=Psyker"
    )
    expect(withoutForeignParams("?trait=Psyker&alliance=Chaos")).toBeNull()
    expect(withoutForeignParams("")).toBeNull()
  })
})

import { describe, expect, it } from "vitest"

import { readFlag, readList, readOneOf, writeUrlQuery } from "./url-query"

type Query = {
  q: string
  tags: string[]
  on: boolean
  off: boolean
  mode: string
  open: string | null
}
const DEFAULTS: Query = {
  q: "",
  tags: [],
  on: true,
  off: false,
  mode: "a",
  open: null,
}

describe("url query", () => {
  it("reads lists, flags with defaults and known options", () => {
    const params = new URLSearchParams("tags=x,,y&on=0&mode=z")
    expect(readList(params, "tags")).toEqual(["x", "y"])
    expect(readFlag(params, "on", true)).toBe(false)
    expect(readFlag(params, "off")).toBe(false)
    expect(readFlag(new URLSearchParams(), "on", true)).toBe(true)
    expect(readOneOf(params.get("mode"), ["a", "b"], "a")).toBe("a")
  })

  it("writes changes, leaving defaults out and other parameters alone", () => {
    const params = writeUrlQuery<Query>(
      new URLSearchParams("keep=1&q=old"),
      { q: "", tags: ["x", "y"], on: false, off: true, mode: "a", open: "id" },
      DEFAULTS
    )
    expect(params.toString()).toBe("keep=1&tags=x%2Cy&on=0&off=1&open=id")
    expect(
      writeUrlQuery<Query>(
        params,
        { on: true, open: null, tags: [] },
        DEFAULTS
      ).toString()
    ).toBe("keep=1&off=1")
  })
})

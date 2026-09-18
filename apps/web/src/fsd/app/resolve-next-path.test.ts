import { describe, expect, it } from "vitest"

import { DEFAULT_SIGNED_IN_PATH, resolveNextPath } from "./resolve-next-path"

describe("resolveNextPath", () => {
  it.each([
    ["/guild/members", "/guild/members"],
    ["/library?tab=shops", "/library?tab=shops"],
    ["/progress/onslaught#top", "/progress/onslaught#top"],
  ])("keeps the relative path %s", (next, expected) => {
    expect(resolveNextPath(next)).toBe(expected)
  })

  it.each([
    ["//evil.example", "protocol-relative"],
    ["/\\evil.example", "backslash protocol-relative"],
    ["https://evil.example", "absolute url"],
    ["javascript:alert(1)", "scheme"],
    ["/guild\\members", "embedded backslash"],
    ["guild/members", "not rooted"],
    ["", "empty"],
  ])("refuses %s (%s)", (next) => {
    expect(resolveNextPath(next)).toBe(DEFAULT_SIGNED_IN_PATH)
  })

  it.each(["/setup", "/setup/key", "/setup/import", "/setup?next=%2Fsetup"])(
    "refuses the setup address %s so the guard cannot bounce setup to setup",
    (next) => {
      expect(resolveNextPath(next)).toBe(DEFAULT_SIGNED_IN_PATH)
    }
  )

  it("falls back when the parameter is missing", () => {
    expect(resolveNextPath(null)).toBe(DEFAULT_SIGNED_IN_PATH)
    expect(resolveNextPath(undefined)).toBe(DEFAULT_SIGNED_IN_PATH)
  })

  it("does not mistake a colon inside a query for a scheme", () => {
    expect(resolveNextPath("/goals?filter=a:b")).toBe("/goals?filter=a:b")
  })
})

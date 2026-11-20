import { describe, expect, it } from "vitest"

import { entityIconClassName, portraitClassName } from "./game-icon-size"

describe("game icon sizes", () => {
  it("draws an inline icon at 16px with a mouse and 20px on touch", () => {
    expect(entityIconClassName("inline")).toBe("size-4 pointer-coarse:size-5")
  })

  it.each([
    ["row", "size-8"],
    ["tile", "size-12"],
  ] as const)("draws a %s icon at one size on every pointer", (size, cls) => {
    expect(entityIconClassName(size)).toBe(cls)
  })

  it.each([
    ["sm", "size-4"],
    ["md", "size-5"],
    ["lg", "size-8"],
    ["hero", "size-11"],
  ] as const)(
    "sizes a badge on a %s portrait to a third of it, at least 16px",
    (portrait, cls) => {
      expect(entityIconClassName(`badge-${portrait}`)).toBe(cls)
    }
  )

  it.each([
    ["sm", "size-10"],
    ["md", "size-16"],
    ["lg", "size-24"],
    ["hero", "size-32"],
  ] as const)("draws a %s portrait at %s", (size, cls) => {
    expect(portraitClassName(size)).toBe(cls)
  })

  it("draws a bare portrait at the same size as a ringed one", () => {
    expect(entityIconClassName("portrait-md")).toBe(portraitClassName("md"))
  })
})

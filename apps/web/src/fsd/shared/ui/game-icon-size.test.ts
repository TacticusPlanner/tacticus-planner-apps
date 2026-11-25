import { describe, expect, it } from "vitest"

import {
  entityIconClassName,
  portraitBadgeSize,
  portraitClassName,
} from "./game-icon-size"

describe("game icon sizes", () => {
  it("draws an inline icon at the 20px baseline on every pointer", () => {
    expect(entityIconClassName("icon")).toBe("size-icon")
  })

  it.each([
    ["icon-sm", "size-icon-sm"],
    ["icon-md", "size-icon-md"],
    ["icon-lg", "size-icon-lg"],
    ["icon-xl", "size-icon-xl"],
    ["icon-2xl", "size-icon-2xl"],
  ] as const)("draws an %s game icon with the %s token", (size, cls) => {
    expect(entityIconClassName(size)).toBe(cls)
  })

  it.each([
    ["portrait-sm", "size-portrait-sm"],
    ["portrait-md", "size-portrait-md"],
    ["portrait-lg", "size-portrait-lg"],
    ["portrait-xl", "size-portrait-xl"],
  ] as const)("draws a %s portrait with the %s token", (size, cls) => {
    expect(portraitClassName(size)).toBe(cls)
  })

  it.each([
    ["portrait-sm", "icon-sm"],
    ["portrait-md", "icon"],
    ["portrait-lg", "icon-lg"],
    ["portrait-xl", "icon-xl"],
  ] as const)(
    "sizes the badge on a %s portrait to the %s icon step",
    (portrait, badge) => {
      expect(portraitBadgeSize(portrait)).toBe(badge)
    }
  )

  it("draws a bare portrait at the same size as a ringed one", () => {
    expect(entityIconClassName("portrait-md")).toBe(
      portraitClassName("portrait-md")
    )
  })
})

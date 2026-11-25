import { describe, expect, it } from "vitest"

import { PROJECT_PRESET_COLORS, pickNewProjectColor } from "./project-color"

const nonGray = PROJECT_PRESET_COLORS.filter((color) => color !== "#6b7280")

describe("pickNewProjectColor", () => {
  it("picks a preset no project uses yet, never gray", () => {
    const taken = nonGray.slice(0, 7)
    for (const random of [0, 0.5, 0.99]) {
      const color = pickNewProjectColor(taken, () => random)
      expect(nonGray.slice(7)).toContain(color)
    }
  })

  it("compares colors trimmed and lowercased", () => {
    const taken = nonGray.slice(0, 8).map((color) => ` ${color.toUpperCase()} `)
    expect(pickNewProjectColor(taken, () => 0.4)).toBe(nonGray[8])
  })

  it("spreads among the least used once every preset is taken", () => {
    const taken = [...nonGray, nonGray[0], nonGray[1]]
    const picks = [0, 0.3, 0.6, 0.99].map((random) =>
      pickNewProjectColor(taken, () => random)
    )
    for (const pick of picks) {
      expect(pick).not.toBe(nonGray[0])
      expect(pick).not.toBe(nonGray[1])
    }
  })

  it("ignores custom colors and missing ones", () => {
    expect(pickNewProjectColor(["#123456", null, undefined, ""], () => 0)).toBe(
      nonGray[0]
    )
  })
})

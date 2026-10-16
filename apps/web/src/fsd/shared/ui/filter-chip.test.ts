import { describe, expect, it } from "vitest"
import CSS from "../../../../../../packages/ui/src/styles/globals.css?raw"

import { FILTER_CHIP_CLASS_NAME } from "./filter-chip"

type Rgb = [number, number, number]

function tokensOf(block: string): Map<string, Rgb> {
  const body = CSS.split(new RegExp(`^${block} \\{`, "m"))[1]!.split(/^\}/m)[0]!
  const out = new Map<string, Rgb>()
  for (const m of body.matchAll(
    /--([\w-]+):\s*oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/g
  )) {
    out.set(m[1]!, [Number(m[2]), Number(m[3]), Number(m[4])])
  }
  return out
}

/** OKLCH -> gamma-encoded sRGB (0-1), clipped to gamut. */
function oklchToSrgb([l, c, h]: Rgb): Rgb {
  const a = c * Math.cos((h * Math.PI) / 180)
  const b = c * Math.sin((h * Math.PI) / 180)
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3
  const lin = [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ]
  return lin.map((v) => {
    const x = Math.min(1, Math.max(0, v))
    return x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055
  }) as Rgb
}

const luminance = ([r, g, b]: Rgb) => {
  const f = (v: number) =>
    v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}

function contrastRatio(a: Rgb, b: Rgb): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi! + 0.05) / (lo! + 0.05)
}

describe("FILTER_CHIP_CLASS_NAME", () => {
  it("sets a 2px primary border and a primary tint on the on state", () => {
    const classes = FILTER_CHIP_CLASS_NAME.split(" ")
    expect(classes).toContain("data-[state=on]:border-2")
    expect(classes).toContain("data-[state=on]:border-primary")
    expect(classes).toContain("data-[state=on]:bg-primary/10")
  })

  it.each([
    ["light", ":root"],
    ["dark", "\\.dark"],
  ])(
    "gives the selected border at least 3:1 against the page and card in the %s theme",
    (_theme, block) => {
      const tokens = tokensOf(block)
      const tok = (name: string) => oklchToSrgb(tokens.get(name)!)
      expect(
        contrastRatio(tok("primary"), tok("background"))
      ).toBeGreaterThanOrEqual(3)
      expect(contrastRatio(tok("primary"), tok("card"))).toBeGreaterThanOrEqual(
        3
      )
    }
  )
})

import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

// Relationship checks over the real tokens in globals.css (no duplicated palette): surface
// luminance ordering and WCAG contrast of meaningful text/control cues, using OKLCH -> sRGB
// conversion and gamma-space alpha compositing (as browsers do). Thresholds, not snapshots.

const css = readFileSync(join(__dirname, "globals.css"), "utf8")
const block = (selector: string) => {
  const start = css.indexOf(`\n${selector} {`)
  return css.slice(start, css.indexOf("\n}", start))
}
const parse = (selector: string) => {
  const raw: Record<string, string> = {}
  for (const m of block(selector).matchAll(/--([\w-]+):\s*([^;]+);/g)) {
    raw[m[1]!] = m[2]!.trim()
  }
  return raw
}
type Rgb = [number, number, number]
const light = parse(":root")
const dark = { ...light, ...parse(".dark") }

const oklch = (value: string): Rgb => {
  const [L, C, h] = value
    .match(/oklch\(([^)]+)\)/)![1]!
    .split(/\s+/)
    .map(Number) as [number, number, number]
  const a = C * Math.cos((h * Math.PI) / 180)
  const b = C * Math.sin((h * Math.PI) / 180)
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  const lin = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
  return lin.map((v) => {
    const c = Math.min(1, Math.max(0, v))
    return 255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)
  }) as Rgb
}
const lum = (c: Rgb) => {
  const f = (v: number) => {
    v /= 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2])
}
const ratio = (a: Rgb, b: Rgb) => {
  const [x, y] = [lum(a), lum(b)]
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
}

// Token set with var() resolution; `t.card` is a colour, `t.mix("primary", 0.9, "card")` is alpha over a backdrop.
const theme = (tokens: Record<string, string>) => {
  const get = (name: string): Rgb => {
    const v = tokens[name]!
    const ref = v.match(/^var\(--([\w-]+)\)$/)
    return ref ? get(ref[1]!) : oklch(v)
  }
  const mix = (fg: string, alpha: number, bg: string | Rgb): Rgb => {
    const f = get(fg)
    const b = typeof bg === "string" ? get(bg) : bg
    return f.map((v, i) => v * alpha + b[i]! * (1 - alpha)) as Rgb
  }
  return { get, mix, L: (n: string) => lum(get(n)) }
}
const themes = { light: theme(light), dark: theme(dark) }

describe("surface hierarchy", () => {
  it("dark: canvas < top bar / section menu < card < popover", () => {
    const t = themes.dark
    expect(t.L("background")).toBeLessThan(t.L("topbar"))
    expect(t.L("background")).toBeLessThan(t.L("section-menu"))
    expect(t.L("topbar")).toBeLessThan(t.L("card"))
    expect(t.L("section-menu")).toBeLessThan(t.L("card"))
    expect(t.L("card")).toBeLessThan(t.L("popover"))
  })

  it("light: cards are lighter than the canvas and the section menu is darker", () => {
    const t = themes.light
    expect(t.L("card")).toBeGreaterThan(t.L("background"))
    expect(t.L("topbar")).toBeGreaterThan(t.L("background"))
    expect(t.L("section-menu")).toBeLessThan(t.L("background"))
  })
})

describe.each(Object.entries(themes))("%s contrast", (_name, t) => {
  const surfaces = ["background", "card", "popover", "topbar", "section-menu"]

  it.each(surfaces)("muted and body text >= 4.5 on %s", (s) => {
    expect(ratio(t.get("muted-foreground"), t.get(s))).toBeGreaterThanOrEqual(
      4.5
    )
    expect(ratio(t.get("foreground"), t.get(s))).toBeGreaterThanOrEqual(4.5)
  })

  it("muted text >= 4.5 on muted and on input/50 placeholders", () => {
    const mf = t.get("muted-foreground")
    expect(ratio(mf, t.get("muted"))).toBeGreaterThanOrEqual(4.5)
    for (const s of ["card", "background"]) {
      expect(ratio(mf, t.mix("input", 0.5, s))).toBeGreaterThanOrEqual(4.5)
    }
  })

  it("primary and destructive text >= 4.5 incl. tinted button backgrounds", () => {
    for (const s of ["background", "card", "popover"]) {
      expect(ratio(t.get("primary"), t.get(s))).toBeGreaterThanOrEqual(4.5)
      expect(ratio(t.get("destructive"), t.get(s))).toBeGreaterThanOrEqual(4.5)
    }
    for (const a of [0.12, 0.15]) {
      expect(
        ratio(t.get("destructive"), t.mix("destructive", a, "card"))
      ).toBeGreaterThanOrEqual(4.5)
    }
    // default button label on hover (primary/90 over card) and at rest
    for (const fill of [t.get("primary"), t.mix("primary", 0.9, "card")]) {
      expect(ratio(t.get("primary-foreground"), fill)).toBeGreaterThanOrEqual(
        4.5
      )
    }
  })

  it("input and unchecked-switch boundaries (muted-foreground/75) >= 3 on card and canvas", () => {
    for (const s of ["card", "background"]) {
      const edge = t.mix("muted-foreground", 0.75, s)
      expect(ratio(edge, t.get(s))).toBeGreaterThanOrEqual(3)
    }
  })

  it("selected-row bars (non-hue cues) >= 3 against their row fill", () => {
    expect(
      ratio(t.get("accent-foreground"), t.get("accent"))
    ).toBeGreaterThanOrEqual(3)
    expect(
      ratio(t.get("sidebar-ring"), t.get("sidebar-accent"))
    ).toBeGreaterThanOrEqual(3)
  })

  it("library card/chip hover tint (accent/10) keeps foreground and muted text >= 4.5", () => {
    for (const s of ["card", "background"]) {
      const tint = t.mix("accent", 0.1, s)
      expect(ratio(t.get("foreground"), tint)).toBeGreaterThanOrEqual(4.5)
      expect(ratio(t.get("muted-foreground"), tint)).toBeGreaterThanOrEqual(4.5)
    }
  })
})

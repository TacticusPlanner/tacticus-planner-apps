import { describe, expect, it } from "vitest"
import CSS from "../../../../../../../../packages/ui/src/styles/globals.css?raw"

/**
 * Computed WCAG 2.2 contrast audit for the Goals surfaces (audit-goal-contrast-and-state-cues).
 *
 * Every pair is a foreground/background combination the goal components actually render (the class
 * that produces it is named in each label), resolved from the design tokens in
 * `packages/ui/src/styles/globals.css` for both themes — not token values in isolation. Translucent
 * layers (`/50`, `opacity-85`, ...) are composited over the surface they sit on, in sRGB like a
 * browser does. Text needs 4.5:1 (1.4.3); meaningful non-text graphics and focus indicators need 3:1
 * (1.4.11). Row surfaces: table rows and non-reorder mobile cards have no fill (page `background`),
 * reorder cards, the reorder bar and the conflict banner sit on `card`.
 *
 * Set VITE_AUDIT_PRINT=1 to print the measured matrix (used to record it in the change's design.md).
 */

type Rgb = [number, number, number]
type Theme = "light" | "dark"

function tokensOf(block: string): Map<string, [number, number, number]> {
  const body = CSS.split(new RegExp(`^${block} \\{`, "m"))[1]!.split(/^\}/m)[0]!
  const out = new Map<string, [number, number, number]>()
  for (const m of body.matchAll(
    /--([\w-]+):\s*oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/g
  )) {
    out.set(m[1]!, [Number(m[2]), Number(m[3]), Number(m[4])])
  }
  return out
}

/** OKLCH -> gamma-encoded sRGB (0-1), clipped to gamut. */
function oklchToSrgb([l, c, h]: [number, number, number]): Rgb {
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

/** `top` at `alpha` over `bottom` (browsers blend in gamma-encoded sRGB). */
const over = (top: Rgb, alpha: number, bottom: Rgb): Rgb =>
  top.map((v, i) => v * alpha + bottom[i]! * (1 - alpha)) as Rgb

// Tailwind v4 default palette (tailwindcss/theme.css) for the amber classes the goal badges use.
const AMBER: Record<number, [number, number, number]> = {
  400: [0.828, 0.189, 84.429],
  700: [0.555, 0.163, 48.998],
  800: [0.473, 0.137, 46.201],
  950: [0.279, 0.077, 45.635],
}

function palette(theme: Theme) {
  const tokens = tokensOf(theme === "light" ? ":root" : "\\.dark")
  const tok = (name: string): Rgb => {
    const value = tokens.get(name)
    if (!value) throw new Error(`missing token --${name} in ${theme}`)
    return oklchToSrgb(value)
  }
  const amber = (shade: number): Rgb => oklchToSrgb(AMBER[shade]!)
  const background = tok("background")
  return {
    tok,
    amber,
    background,
    card: tok("card"),
    // `hover:bg-muted/50` on a table row (and a hovered ghost/handle button is `bg-muted`).
    rowHover: over(tok("muted"), 0.5, background),
  }
}

type Ctx = ReturnType<typeof palette> & { theme: Theme }
type Case = {
  id: string
  min: 4.5 | 3
  fg: (c: Ctx) => Rgb
  bg: (c: Ctx) => Rgb
}

const text = (id: string, fg: Case["fg"], bg: Case["bg"]): Case => ({
  id,
  min: 4.5,
  fg,
  bg,
})
const graphic = (id: string, fg: Case["fg"], bg: Case["bg"]): Case => ({
  id,
  min: 3,
  fg,
  bg,
})

const CASES: Case[] = [
  // --- Visible global priority number (text-foreground; Comfortable and Compact share the class) ---
  text(
    "priority number on row (text-foreground / background)",
    (c) => c.tok("foreground"),
    (c) => c.background
  ),
  text(
    "priority number on hovered row (muted/50)",
    (c) => c.tok("foreground"),
    (c) => c.rowHover
  ),
  text(
    "priority number on reorder card (card)",
    (c) => c.tok("foreground"),
    (c) => c.card
  ),
  text(
    "priority number on a dragged desktop row (bg-card)",
    (c) => c.tok("foreground"),
    (c) => c.card
  ),
  // --- Secondary text: type caption, notes, Remaining column, legend, reorder bar hint, banner text ---
  text(
    "text-muted-foreground on row (background)",
    (c) => c.tok("muted-foreground"),
    (c) => c.background
  ),
  text(
    "text-muted-foreground on hovered row (muted/50)",
    (c) => c.tok("muted-foreground"),
    (c) => c.rowHover
  ),
  text(
    "text-muted-foreground on card (reorder bar, banner, reorder card)",
    (c) => c.tok("muted-foreground"),
    (c) => c.card
  ),
  text(
    "text-muted-foreground on muted (hovered drag handle)",
    (c) => c.tok("muted-foreground"),
    (c) => c.tok("muted")
  ),
  // --- Dragged row: no opacity dimming any more; the row is lifted onto an opaque card surface ---
  text(
    "dragged row text-foreground (bg-card)",
    (c) => c.tok("foreground"),
    (c) => c.card
  ),
  text(
    "dragged row text-muted-foreground (bg-card)",
    (c) => c.tok("muted-foreground"),
    (c) => c.card
  ),
  // --- Drag handle (icon is the boundary-defining graphic) and focus indicator ---
  graphic(
    "drag handle icon on row (background)",
    (c) => c.tok("muted-foreground"),
    (c) => c.background
  ),
  graphic(
    "drag handle icon on reorder card (card)",
    (c) => c.tok("muted-foreground"),
    (c) => c.card
  ),
  graphic(
    "drag handle icon on hovered handle (muted)",
    (c) => c.tok("muted-foreground"),
    (c) => c.tok("muted")
  ),
  graphic(
    "drag handle focus ring (ring-ring) on row",
    (c) => c.tok("ring"),
    (c) => c.background
  ),
  graphic(
    "badge/button focus border (border-ring) on row",
    (c) => c.tok("ring"),
    (c) => c.background
  ),
  graphic(
    "dragged mobile card border (border-ring) on page",
    (c) => c.tok("ring"),
    (c) => c.background
  ),
  graphic(
    "dragged desktop row outline (outline-ring) on card",
    (c) => c.tok("ring"),
    (c) => c.card
  ),
  // --- Order-conflict banner (Alert destructive on card) and Retry/Dismiss ---
  text(
    "banner title text-destructive on card",
    (c) => c.tok("destructive"),
    (c) => c.card
  ),
  text(
    "banner description text-destructive/90 on card",
    (c) => over(c.tok("destructive"), 0.9, c.card),
    (c) => c.card
  ),
  text(
    "banner Retry (outline: foreground on bg-background | transparent-on-card)",
    (c) => c.tok("foreground"),
    (c) => (c.theme === "light" ? c.background : c.card)
  ),
  text(
    "banner Dismiss (ghost) foreground on card",
    (c) => c.tok("foreground"),
    (c) => c.card
  ),
  // --- Mobile reorder bar ---
  text(
    "reorder bar Done: primary-foreground on primary",
    (c) => c.tok("primary-foreground"),
    (c) => c.tok("primary")
  ),
  // --- Status badges (text is always present) ---
  text(
    "Active badge: primary-foreground on primary",
    (c) => c.tok("primary-foreground"),
    (c) => c.tok("primary")
  ),
  text(
    "Paused/Completed badge: secondary-foreground on secondary",
    (c) => c.tok("secondary-foreground"),
    (c) => c.tok("secondary")
  ),
  text(
    "Archived badge: foreground on row",
    (c) => c.tok("foreground"),
    (c) => c.background
  ),
  text(
    "Restricted badge: amber-950 on amber-400",
    (c) => c.amber(950),
    (c) => c.amber(400)
  ),
  text(
    "Blocked text (amber-800 | dark amber-400) on row",
    (c) => (c.theme === "light" ? c.amber(800) : c.amber(400)),
    (c) => c.background
  ),
  text(
    "Blocked text on hovered row",
    (c) => (c.theme === "light" ? c.amber(800) : c.amber(400)),
    (c) => c.rowHover
  ),
  text(
    "Blocked text on card",
    (c) => (c.theme === "light" ? c.amber(800) : c.amber(400)),
    (c) => c.card
  ),
  // --- Other goal text ---
  text(
    "potential % (text-primary) on row",
    (c) => c.tok("primary"),
    (c) => c.background
  ),
  text(
    "potential % (text-primary) on hovered row",
    (c) => c.tok("primary"),
    (c) => c.rowHover
  ),
  text(
    "potential % (text-primary) on card",
    (c) => c.tok("primary"),
    (c) => c.card
  ),
  text(
    "project chip: primary on bg-primary/10",
    (c) => c.tok("primary"),
    (c) => over(c.tok("primary"), 0.1, c.background)
  ),
  text(
    "error box: destructive on bg-destructive/5",
    (c) => c.tok("destructive"),
    (c) => over(c.tok("destructive"), 0.05, c.background)
  ),
  text(
    "ceiling reason (tooltip text-background @75%)",
    (c) => over(c.background, 0.75, c.tok("foreground")),
    (c) => c.tok("foreground")
  ),
  // --- Project quick-nav chips, Create project control and inline project create ---
  text(
    "quick-nav chip: foreground on row",
    (c) => c.tok("foreground"),
    (c) => c.background
  ),
  text(
    "quick-nav chip hover: accent-foreground on accent",
    (c) => c.tok("accent-foreground"),
    (c) => c.tok("accent")
  ),
  text(
    "Create project (outline): foreground on bg-background | page",
    (c) => c.tok("foreground"),
    (c) => c.background
  ),
  text(
    "quick-nav error text-destructive on row",
    (c) => c.tok("destructive"),
    (c) => c.background
  ),
  text(
    "inline create / membership error text-destructive on popover",
    (c) => c.tok("destructive"),
    (c) => c.tok("popover")
  ),
  graphic(
    "quick-nav chip focus ring (ring-2 ring-ring) on row",
    (c) => c.tok("ring"),
    (c) => c.background
  ),
  // --- Reached row/card (bg-success tint, "Reached" badge, check mark, "-" cells) ---
  text(
    "reached row text-foreground on tint (success)",
    (c) => c.tok("foreground"),
    (c) => c.tok("success")
  ),
  text(
    "reached row text-muted-foreground on tint (notes, '-' cells, Remaining)",
    (c) => c.tok("muted-foreground"),
    (c) => c.tok("success")
  ),
  text(
    "Reached badge: success-foreground on success",
    (c) => c.tok("success-foreground"),
    (c) => c.tok("success")
  ),
  text(
    "reached row name link (text-primary) on tint",
    (c) => c.tok("primary"),
    (c) => c.tok("success")
  ),
  graphic(
    "reached check mark (success-foreground) vs tint",
    (c) => c.tok("success-foreground"),
    (c) => c.tok("success")
  ),
  text(
    "Ability pill: text-muted-foreground on bg-muted",
    (c) => c.tok("muted-foreground"),
    (c) => c.tok("muted")
  ),
  text(
    "Ability pill target: foreground on bg-muted",
    (c) => c.tok("foreground"),
    (c) => c.tok("muted")
  ),
  // --- Progress graphics (3:1) ---
  graphic(
    "actual fill (primary) vs track (muted)",
    (c) => c.tok("primary"),
    (c) => c.tok("muted")
  ),
  graphic(
    "potential stripe (primary, opacity-85) vs track (muted)",
    (c) => over(c.tok("primary"), 0.85, c.tok("muted")),
    (c) => c.tok("muted")
  ),
  graphic(
    "ceiling marker (amber-700 | dark amber-400) vs track (muted)",
    (c) => (c.theme === "light" ? c.amber(700) : c.amber(400)),
    (c) => c.tok("muted")
  ),
  graphic(
    "ceiling marker vs row (background)",
    (c) => (c.theme === "light" ? c.amber(700) : c.amber(400)),
    (c) => c.background
  ),
  graphic(
    "ceiling marker vs card",
    (c) => (c.theme === "light" ? c.amber(700) : c.amber(400)),
    (c) => c.card
  ),
  graphic(
    "legend Potential swatch ring (ring-primary) vs row",
    (c) => c.tok("primary"),
    (c) => c.background
  ),
  graphic(
    "legend Potential swatch ring vs its fill (primary/25)",
    (c) => c.tok("primary"),
    (c) => over(c.tok("primary"), 0.25, c.background)
  ),
]

const measured = (["light", "dark"] as const).flatMap((theme) => {
  const ctx: Ctx = { ...palette(theme), theme }
  return CASES.map((c) => ({
    theme,
    id: c.id,
    min: c.min,
    ratio: contrastRatio(c.fg(ctx), c.bg(ctx)),
  }))
})

describe("goal contrast audit (computed from globals.css tokens)", () => {
  it("computes reference ratios correctly", () => {
    expect(contrastRatio([0, 0, 0], [1, 1, 1])).toBeCloseTo(21, 5)
    // #767676 on white is the classic 4.54:1 AA boundary grey.
    const grey = 0x76 / 255
    expect(contrastRatio([grey, grey, grey], [1, 1, 1])).toBeCloseTo(4.54, 2)
  })

  it.each(measured)("$theme: $id >= $min:1", ({ ratio, min }) => {
    expect(ratio).toBeGreaterThanOrEqual(min)
  })

  if (import.meta.env.VITE_AUDIT_PRINT) {
    it("prints the measured matrix", () => {
      const rows = CASES.map((c) => {
        const at = (theme: Theme) =>
          measured.find((m) => m.theme === theme && m.id === c.id)!.ratio
        return `${c.id} | ${c.min} | ${at("light").toFixed(2)} | ${at("dark").toFixed(2)}`
      })
      console.info(["id | min | light | dark", ...rows].join("\n"))
    })
  }
})

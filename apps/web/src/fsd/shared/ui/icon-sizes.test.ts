import { describe, expect, it } from "vitest"

import { classStrings, jsxOpeningTags } from "@/test/jsx-source-scan"

// The ui-sizing skill's icon rule: every icon, a lucide glyph or game art, is sized by a step on
// the icon ramp (`size-icon-xs` … `size-icon-2xl`, 20px `size-icon` the baseline) or the portrait
// ramp (`size-portrait-sm` … `size-portrait-xl`). Game icon components take the step as their
// `size` prop. A raw size class (`size-4`, `size-8`, `h-6`) on an icon, or on the svgs a container
// sizes, sidesteps the scale. Fills of a sized frame (`size-full`, fractions, `size-[78%]`) and wide
// art sized by its height (`h-4 w-auto`) are fine.

/** Every component file in `src`, keyed by its path from the app root (`/src/...`). Read through
 *  Vite's glob, like the other source scans, so the test needs no Node types. */
const SOURCES = import.meta.glob<string>(
  ["/src/**/*.tsx", "!/src/**/*.test.tsx"],
  { query: "?raw", import: "default", eager: true }
)

/** The game icon components, each sized by its `size` prop. */
const GAME_ICONS = [
  "EntityIcon",
  "RarityIcon",
  "UpgradeIcon",
  "ObjectiveIcon",
  "UnitPortrait",
  "NpcPortrait",
  "RaidBossPortrait",
  "TeamUnitPortrait",
  "ResourceIcon",
  "GoalResourceIcon",
  "RarityBadge",
]

/** The local names a file imports from lucide-react, plus the shared spinner and brand icons. */
function iconComponents(source: string): string[] {
  const names: string[] = []
  const imports = source.matchAll(
    /import\s*\{([^}]*)\}\s*from\s*"(?:lucide-react|@workspace\/ui\/components\/spinner|[^"]*discord-icon)"/g
  )
  for (const [, list = ""] of imports) {
    for (const entry of list.split(",")) {
      const name = entry
        .trim()
        .split(/\s+as\s+/)
        .pop()
      if (name && !name.startsWith("type ")) names.push(name)
    }
  }
  return names
}

const RAW_SIZE = /(?<![\w:[-])(?:[a-z-]+:)*size-\d+(?:\.\d+)?(?![\w./%-])/
const RAW_EDGE = /(?<![\w:[-])(?:[a-z-]+:)*[hw]-\d+(?:\.\d+)?(?![\w./%-])/
const RAW_SVG_SIZE = /svg[^\]\s]*\]:size-\d+(?:\.\d+)?(?![\w./%-])/

/** Whether a class string sizes an icon off the scale. */
function offences(classes: string): boolean {
  if (RAW_SIZE.test(classes)) return true
  return RAW_EDGE.test(classes) && !/\bw-auto\b/.test(classes)
}

/** Each opening tag of the named components across the app, with its file. */
function tagsOf(names: (source: string) => string[]) {
  return Object.entries(SOURCES).flatMap(([file, source]) =>
    names(source).flatMap((name) =>
      jsxOpeningTags(source, `<${name}`).map((found) => ({ ...found, file }))
    )
  )
}

function offending(tags: ReturnType<typeof tagsOf>): string[] {
  return tags
    .filter(({ tag }) => classStrings(tag).some(offences))
    .map(({ file, line }) => `${file.replace(/^\/src\//, "")}:${line}`)
}

describe("icon sizes (ui-sizing, Icons)", () => {
  it("sizes every lucide icon with the icon tokens, not a raw size class", () => {
    const tags = tagsOf(iconComponents)
    // The scan sees the app's icons (a broken walk would pass vacuously).
    expect(tags.length).toBeGreaterThan(400)
    expect(offending(tags)).toEqual([])
  })

  it("sizes every game icon by a scale step, not by size classes", () => {
    const tags = tagsOf(() => GAME_ICONS)
    expect(tags.length).toBeGreaterThan(250)
    expect(offending(tags)).toEqual([])
  })

  it("sizes the svgs inside a container with the icon tokens", () => {
    const found = Object.entries(SOURCES).flatMap(([file, source]) =>
      source
        .split("\n")
        .flatMap((text, index) =>
          RAW_SVG_SIZE.test(text)
            ? [`${file.replace(/^\/src\//, "")}:${index + 1}`]
            : []
        )
    )
    expect(found).toEqual([])
  })

  it("reads renamed imports and skips other modules", () => {
    expect(
      iconComponents(`import { Check, X as Close } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"`)
    ).toEqual(["Check", "Close", "Spinner"])
  })

  it("reads the classes of a multi-line className", () => {
    const [found] = jsxOpeningTags(
      `<EntityIcon
      alt=""
      className={cn(
        "size-7 rounded-full",
        locked && "opacity-50"
      )}
      src={icon}
    />`,
      "<EntityIcon"
    )
    expect(found && classStrings(found.tag)).toEqual([
      "size-7 rounded-full",
      "opacity-50",
    ])
  })

  it("flags raw sizes and allows the tokens, fills and wide art", () => {
    expect(offences("size-4 shrink-0")).toBe(true)
    expect(offences("pointer-coarse:size-5")).toBe(true)
    expect(offences("size-3.5")).toBe(true)
    expect(offences("size-10 text-primary")).toBe(true)
    expect(offences("md:size-12")).toBe(true)
    expect(offences("h-6")).toBe(true)
    expect(offences("size-icon shrink-0")).toBe(false)
    expect(offences("size-icon-2xl")).toBe(false)
    expect(offences("size-portrait-sm rounded-full")).toBe(false)
    expect(offences("size-full object-cover")).toBe(false)
    expect(offences("size-1/2")).toBe(false)
    expect(offences("h-4 w-auto")).toBe(false)
    expect(offences("absolute top-1/2 left-1/2 size-[78%]")).toBe(false)
    expect(RAW_SVG_SIZE.test("[&>svg]:size-4")).toBe(true)
    expect(RAW_SVG_SIZE.test("[&_svg]:size-6")).toBe(true)
    expect(RAW_SVG_SIZE.test("[&_svg:not([class*='size-'])]:size-icon")).toBe(
      false
    )
  })
})

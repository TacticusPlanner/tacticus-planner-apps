import { describe, expect, it } from "vitest"

import { classStrings, jsxOpeningTags } from "@/test/jsx-source-scan"

// The ui-sizing skill's icon rule: an icon is 20px (`size-icon`), or 16px / 12px for a named
// exception (`size-icon-sm`, `size-icon-xs`). A raw 12 to 20px size class on an icon, or on the
// svgs a container sizes, is the old scale creeping back. Bigger standalone icons (`size-6` and
// up) and fills (`size-full`) are fine.

/** Every component file in `src`, keyed by its path from the app root (`/src/...`). */
const SOURCES = import.meta.glob<string>(
  ["/src/**/*.tsx", "!/src/**/*.test.tsx"],
  { query: "?raw", import: "default", eager: true }
)

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

const RAW_ICON_SIZE =
  /(?<![\w[-])(?:[a-z-]+:)*size-(?:[345]|[34]\.5)(?![\w./%-])/
const RAW_SVG_SIZE = /svg[^\]\s]*\]:size-(?:[345]|[34]\.5)(?![\w./%-])/

describe("icon sizes (ui-sizing, Icons)", () => {
  it("sizes every lucide icon with the icon tokens, not a raw size class", () => {
    const tags = Object.entries(SOURCES).flatMap(([file, source]) =>
      iconComponents(source).flatMap((name) =>
        jsxOpeningTags(source, `<${name}`).map((found) => ({ ...found, file }))
      )
    )
    const found = tags
      .filter(({ tag }) =>
        classStrings(tag).some((classes) => RAW_ICON_SIZE.test(classes))
      )
      .map(({ file, line }) => `${file.replace(/^\/src\//, "")}:${line}`)
    // The scan sees the app's icons (a broken walk would pass vacuously).
    expect(tags.length).toBeGreaterThan(400)
    expect(found).toEqual([])
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

  it("flags raw 12 to 20px sizes and allows the tokens and bigger icons", () => {
    expect(RAW_ICON_SIZE.test("size-4 shrink-0")).toBe(true)
    expect(RAW_ICON_SIZE.test("pointer-coarse:size-5")).toBe(true)
    expect(RAW_ICON_SIZE.test("size-3.5")).toBe(true)
    expect(RAW_ICON_SIZE.test("size-icon shrink-0")).toBe(false)
    expect(RAW_ICON_SIZE.test("size-icon-sm")).toBe(false)
    expect(RAW_ICON_SIZE.test("size-6")).toBe(false)
    expect(RAW_ICON_SIZE.test("size-full")).toBe(false)
    expect(RAW_SVG_SIZE.test("[&>svg]:size-4")).toBe(true)
    expect(RAW_SVG_SIZE.test("[&_svg:not([class*='size-'])]:size-icon")).toBe(
      false
    )
  })
})

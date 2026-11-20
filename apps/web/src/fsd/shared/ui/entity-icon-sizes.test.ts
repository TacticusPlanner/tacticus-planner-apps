import { describe, expect, it } from "vitest"

// The UI style guide's rule 6: a game icon's size comes from its role (`size="inline"`, `row`,
// `tile`, a badge or a portrait), never from size classes at the call site. Fills of a sized frame
// (`size-full`, fractions) and wide art sized by its height (`h-4 w-auto`) are the exceptions.

/** Every component file in `src`, keyed by its path from the app root (`/src/...`). Read through
 *  Vite's glob, like the other source scans, so the test needs no Node types. */
const SOURCES = import.meta.glob<string>(
  ["/src/**/*.tsx", "!/src/**/*.test.tsx"],
  { query: "?raw", import: "default", eager: true }
)

/** The icon components whose size is a role: `EntityIcon` and `RarityIcon`. */
const ICON_COMPONENTS = ["<EntityIcon", "<RarityIcon"]

/** Each opening tag of `component` (default `<EntityIcon`) in the source, with its line. */
function entityIconTags(
  source: string,
  component = "<EntityIcon"
): { tag: string; line: number }[] {
  const tags: { tag: string; line: number }[] = []
  let start = source.indexOf(component)
  while (start !== -1) {
    let depth = 0
    let end = start + component.length
    for (; end < source.length; end++) {
      const char = source[end]
      if (char === "{") depth++
      else if (char === "}") depth--
      else if (depth === 0 && (char === ">" || source.startsWith("/>", end)))
        break
    }
    tags.push({
      tag: source.slice(start, end),
      line: source.slice(0, start).split("\n").length,
    })
    start = source.indexOf(component, end)
  }
  return tags
}

const FIXED_SIZE = /(?<![\w:[-])(?:[a-z-]+:)?size-\d+(?:\.\d+)?(?![\w./%-])/
const FIXED_EDGE = /(?<![\w:[-])(?:[a-z-]+:)?[hw]-\d+(?:\.\d+)?(?![\w./%-])/

/** The class strings in a tag's `className`, string literals only. */
function classStrings(tag: string): string[] {
  const match = /className=(\{[\s\S]*?\}|"[^"]*")\s*(?:\w[\w-]*=|\/?$)/.exec(
    tag
  )
  if (!match?.[1]) return []
  return [...match[1].matchAll(/"([^"]*)"/g)].map((literal) => literal[1] ?? "")
}

function offences(classes: string): boolean {
  if (FIXED_SIZE.test(classes)) return true
  return FIXED_EDGE.test(classes) && !/\bw-auto\b/.test(classes)
}

describe("game icon sizes (UI style guide, rule 6)", () => {
  it("sizes every EntityIcon and RarityIcon by its role, not by size classes", () => {
    const tags = Object.entries(SOURCES).flatMap(([file, source]) => {
      return ICON_COMPONENTS.flatMap((component) =>
        entityIconTags(source, component).map((found) => ({ ...found, file }))
      )
    })
    const found = tags
      .filter(({ tag }) => classStrings(tag).some(offences))
      .map(({ file, line }) => `${file.replace(/^\/src\//, "")}:${line}`)
    // The scan sees the app's call sites (a broken walk would pass vacuously).
    expect(tags.length).toBeGreaterThan(250)
    expect(found).toEqual([])
  })

  it("reads the classes of a multi-line className", () => {
    const [found] = entityIconTags(`<EntityIcon
      alt=""
      className={cn(
        "size-7 rounded-full",
        locked && "opacity-50"
      )}
      src={icon}
    />`)
    expect(found && classStrings(found.tag)).toEqual([
      "size-7 rounded-full",
      "opacity-50",
    ])
  })

  it("flags a fixed size class and allows fills and wide art", () => {
    expect(offences("size-5 shrink-0")).toBe(true)
    expect(offences("md:size-12")).toBe(true)
    expect(offences("h-6")).toBe(true)
    expect(offences("size-full object-cover")).toBe(false)
    expect(offences("size-1/2")).toBe(false)
    expect(offences("h-4 w-auto")).toBe(false)
    expect(offences("absolute top-1/2 left-1/2 size-[78%]")).toBe(false)
  })
})

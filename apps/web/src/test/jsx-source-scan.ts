// Helpers for tests that scan the app's component sources for a style-guide rule (icon sizes),
// reading raw text through Vite's glob so they need no Node types or TypeScript parser.

/** Each opening tag of `component` (such as `<EntityIcon`) in the source, with its line. */
export function jsxOpeningTags(
  source: string,
  component: string
): { tag: string; line: number }[] {
  const tags: { tag: string; line: number }[] = []
  let start = source.indexOf(component)
  while (start !== -1) {
    // `<Check` must not match `<CheckIcon` or `<Checkbox`.
    if (/[\w$]/.test(source[start + component.length] ?? "")) {
      start = source.indexOf(component, start + component.length)
      continue
    }
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

/** The class strings in a tag's `className`, string literals only. */
export function classStrings(tag: string): string[] {
  const match = /className=(\{[\s\S]*?\}|"[^"]*")\s*(?:\w[\w-]*=|\/?$)/.exec(
    tag
  )
  if (!match?.[1]) return []
  return [...match[1].matchAll(/"([^"]*)"/g)].map((literal) => literal[1] ?? "")
}

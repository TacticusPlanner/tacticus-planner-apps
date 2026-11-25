import { describe, expect, it } from "vitest"

import { cn } from "./utils"

describe("cn", () => {
  it("combines conditional classes", () => {
    expect(cn("inline-flex", { "items-center": true, hidden: false })).toBe(
      "inline-flex items-center"
    )
  })

  it("merges conflicting Tailwind classes", () => {
    expect(cn("rounded-sm p-2", "p-4")).toBe("rounded-sm p-4")
  })

  it("merges the icon size tokens like any other size", () => {
    expect(cn("size-icon shrink-0", "size-icon-sm")).toBe(
      "shrink-0 size-icon-sm"
    )
    expect(cn("size-icon animate-spin", "size-8")).toBe("animate-spin size-8")
    expect(cn("size-4", "size-icon-xs")).toBe("size-icon-xs")
    expect(cn("size-icon-lg", "size-icon-2xl")).toBe("size-icon-2xl")
    expect(cn("size-portrait-sm rounded-full", "size-portrait-xl")).toBe(
      "rounded-full size-portrait-xl"
    )
  })
})

import { describe, expect, it } from "vitest"

import { cn } from "./cn"

describe("cn", () => {
  it("combines conditional classes", () => {
    expect(cn("flex", { hidden: false, "items-center": true })).toBe(
      "flex items-center"
    )
  })

  it("merges conflicting Tailwind classes", () => {
    expect(cn("px-2 text-sm", "px-4")).toBe("text-sm px-4")
  })
})

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
})

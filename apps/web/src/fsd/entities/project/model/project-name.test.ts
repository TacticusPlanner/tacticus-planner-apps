import { describe, expect, it } from "vitest"

import { isProjectNameValid, PROJECT_NAME_MAX_LENGTH } from "./project-name"

describe("isProjectNameValid", () => {
  it("requires a non-blank name within the API length limit", () => {
    expect(isProjectNameValid("Event plan")).toBe(true)
    expect(isProjectNameValid("  padded  ")).toBe(true)
    expect(isProjectNameValid("   ")).toBe(false)
    expect(isProjectNameValid("a".repeat(PROJECT_NAME_MAX_LENGTH))).toBe(true)
    expect(isProjectNameValid("a".repeat(PROJECT_NAME_MAX_LENGTH + 1))).toBe(
      false
    )
  })
})

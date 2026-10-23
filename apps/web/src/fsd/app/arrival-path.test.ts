import { describe, expect, it } from "vitest"

import { arrivalPath } from "./arrival-path"

describe("arrivalPath", () => {
  it("lands on the default page without an import project", () => {
    expect(arrivalPath(null, null)).toBe("/home")
  })

  it("opens Goals on the import project when nothing else was remembered", () => {
    expect(arrivalPath(null, "p-1")).toBe("/plan/goals?project=p-1")
    expect(arrivalPath("/home", "p-1")).toBe("/plan/goals?project=p-1")
  })

  it("keeps a remembered destination", () => {
    expect(arrivalPath("/plan/schedule", "p-1")).toBe("/plan/schedule")
  })
})

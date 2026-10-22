import { describe, expect, it } from "vitest"

import { isOnlyMemberOf } from "./project-removal"

describe("isOnlyMemberOf", () => {
  const row = (...projectIds: string[]) => ({
    projects: projectIds.map((projectId) => ({ projectId })),
  })

  it("is true only when the project is the row's single membership", () => {
    expect(isOnlyMemberOf(row("p1"), "p1")).toBe(true)
    expect(isOnlyMemberOf(row("p1", "p2"), "p1")).toBe(false)
    expect(isOnlyMemberOf(row("p2"), "p1")).toBe(false)
  })

  it("is false while the row's memberships are unknown", () => {
    expect(isOnlyMemberOf({}, "p1")).toBe(false)
    expect(isOnlyMemberOf(row(), "p1")).toBe(false)
  })
})

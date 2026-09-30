import { describe, expect, it } from "vitest"

import { createGoalScopeProjectId } from "./create-goal-scope"

describe("createGoalScopeProjectId", () => {
  it("reads the scoped project on the Goals page", () => {
    expect(createGoalScopeProjectId("/plan/goals", "?project=p1")).toBe("p1")
  })

  it("returns nothing on unscoped Goals", () => {
    expect(createGoalScopeProjectId("/plan/goals", "")).toBeUndefined()
  })

  it("ignores the param on any other route", () => {
    expect(
      createGoalScopeProjectId("/plan/projects", "?project=p1")
    ).toBeUndefined()
    expect(createGoalScopeProjectId("/home", "?project=p1")).toBeUndefined()
  })
})

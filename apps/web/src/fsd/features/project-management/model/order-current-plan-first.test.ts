import { describe, expect, it } from "vitest"

import { orderCurrentPlanFirst } from "./order-current-plan-first"

function project(overrides: Record<string, unknown>) {
  return {
    projectId: "p1",
    name: "Project",
    color: null,
    description: null,
    status: "Active",
    isActivePlan: false,
    isDefault: false,
    revision: 1,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  } as never
}

describe("orderCurrentPlanFirst", () => {
  it("puts Current plan first, keeping the rest in order", () => {
    const result = orderCurrentPlanFirst([
      project({ projectId: "p2" }),
      project({ projectId: "p1", isActivePlan: true }),
      project({ projectId: "p3" }),
    ])
    expect(result.map((p) => p.projectId)).toEqual(["p1", "p2", "p3"])
  })

  it("excludes archived projects", () => {
    const result = orderCurrentPlanFirst([
      project({ projectId: "p1", isActivePlan: true }),
      project({ projectId: "p2", status: "Archived" }),
    ])
    expect(result.map((p) => p.projectId)).toEqual(["p1"])
  })

  it("returns the non-archived list unchanged when no project is Current plan", () => {
    const result = orderCurrentPlanFirst([
      project({ projectId: "p1" }),
      project({ projectId: "p2" }),
    ])
    expect(result.map((p) => p.projectId)).toEqual(["p1", "p2"])
  })
})

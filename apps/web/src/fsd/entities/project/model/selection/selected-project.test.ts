import { describe, expect, it } from "vitest"

import type { ProjectSummary } from "../types"
import { resolveSelectedProjectId } from "./selected-project"

function project(
  projectId: string,
  status: ProjectSummary["status"] = "Active"
): ProjectSummary {
  return {
    projectId,
    name: projectId,
    description: null,
    color: null,
    status,
    isDefault: false,
    goalIds: [],
    target: null,
    revision: 0,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  }
}

describe("resolveSelectedProjectId", () => {
  const projects = [project("p1"), project("p2", "Archived")]

  it("applies a stored project the loaded list has", () => {
    expect(resolveSelectedProjectId("p1", projects, "ready")).toBe("p1")
  })

  it("falls back to all goals for a deleted project", () => {
    expect(resolveSelectedProjectId("gone", projects, "ready")).toBeUndefined()
  })

  it("falls back to all goals for an archived project", () => {
    expect(resolveSelectedProjectId("p2", projects, "ready")).toBeUndefined()
  })

  it("applies the stored id while the list loads", () => {
    expect(resolveSelectedProjectId("gone", [], "loading")).toBe("gone")
  })

  it("applies nothing when the list failed or is absent", () => {
    expect(resolveSelectedProjectId("p1", [], "unavailable")).toBeUndefined()
  })

  it("applies nothing when nothing is stored", () => {
    expect(resolveSelectedProjectId(null, projects, "ready")).toBeUndefined()
  })
})

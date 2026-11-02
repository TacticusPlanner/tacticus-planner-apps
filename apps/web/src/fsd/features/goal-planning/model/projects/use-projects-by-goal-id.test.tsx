import { renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import type { GoalDetail } from "@/entities/goal"
import type { ProjectSummary } from "@/entities/project"

import type { GoalsFetchState } from "../goals-data/use-goals"
import { useProjectsByGoalId } from "./use-projects-by-goal-id"

const project = (
  projectId: string,
  status: ProjectSummary["status"] = "Active"
) =>
  ({
    projectId,
    name: `${projectId} name`,
    description: null,
    color: null,
    status,
    isDefault: false,
    revision: 0,
    createdAt: "",
    updatedAt: "",
  }) as ProjectSummary

const goal = (goalId: string, projectIds: string[]) =>
  ({ goalId, projectIds }) as unknown as GoalDetail

const loaded = (...goals: GoalDetail[]): GoalsFetchState => ({
  status: "success",
  goals,
})

describe("useProjectsByGoalId", () => {
  it("names each goal's projects from the project list", () => {
    const { result } = renderHook(() =>
      useProjectsByGoalId(
        [project("a"), project("b", "Paused")],
        loaded(goal("g1", ["a", "b"])),
        loaded(goal("g2", ["b"]))
      )
    )
    expect(result.current.get("g1")).toEqual([
      { projectId: "a", name: "a name", color: null },
      { projectId: "b", name: "b name", color: null },
    ])
    expect(result.current.get("g2")).toEqual([
      { projectId: "b", name: "b name", color: null },
    ])
  })

  it("leaves out archived projects the goal still belongs to", () => {
    const { result } = renderHook(() =>
      useProjectsByGoalId(
        [project("v1", "Archived"), project("new")],
        loaded(goal("moved", ["v1", "new"]), goal("only-archived", ["v1"])),
        { status: "idle" }
      )
    )
    expect(result.current.get("moved")).toEqual([
      { projectId: "new", name: "new name", color: null },
    ])
    expect(result.current.get("only-archived")).toEqual([])
  })
})

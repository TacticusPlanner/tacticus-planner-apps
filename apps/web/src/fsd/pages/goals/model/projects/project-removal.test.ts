import { describe, expect, it } from "vitest"

import type { ProjectGoalSummary, ProjectSummary } from "@/entities/project"

import { planProjectRemoval } from "./project-removal"

function project(overrides: Partial<ProjectSummary> = {}): ProjectSummary {
  return {
    projectId: "proj-default",
    name: "Default",
    description: null,
    color: null,
    status: "Active",
    isActivePlan: false,
    isDefault: true,
    revision: 0,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  }
}

const goal = {
  goalId: "goal-1",
  entityType: "Character",
  entityId: "hero1",
  goalType: "Rank" as const,
  status: "Active",
}

function member(
  overrides: Partial<ProjectGoalSummary["goal"]> = {}
): ProjectGoalSummary {
  return {
    priority: 1,
    goal: {
      goalId: "goal-other",
      entityType: "Character",
      entityId: "hero1",
      goalType: "Rank",
      status: "Active",
      notes: null,
      dependsOn: [],
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
      ...overrides,
    },
  }
}

describe("planProjectRemoval", () => {
  it("submits the remaining memberships when the goal belongs to several projects", () => {
    expect(
      planProjectRemoval({
        memberships: ["proj-a", "proj-b", "proj-default"],
        projectId: "proj-a",
        defaultProject: project(),
        goal,
      })
    ).toEqual({ kind: "remove", projectIds: ["proj-b", "proj-default"] })
  })

  it("relocates a last membership to the Default project", () => {
    expect(
      planProjectRemoval({
        memberships: ["proj-a"],
        projectId: "proj-a",
        defaultProject: project(),
        goal,
      })
    ).toEqual({
      kind: "relocate",
      projectIds: ["proj-default"],
      destination: project(),
    })
  })

  it("reports the reason instead of throwing when Default is the only membership", () => {
    expect(
      planProjectRemoval({
        memberships: ["proj-default"],
        projectId: "proj-default",
        defaultProject: project(),
        goal,
      })
    ).toEqual({ kind: "unavailable", reason: "lastMembershipIsDefault" })
  })

  it("produces no submittable list while the Default project is unknown", () => {
    const plan = planProjectRemoval({
      memberships: ["proj-a"],
      projectId: "proj-a",
      defaultProject: undefined,
      goal,
    })

    expect(plan).toEqual({ kind: "unavailable", reason: "destinationUnknown" })
    expect(plan).not.toHaveProperty("projectIds")
  })

  it("produces no submittable list while membership is unknown", () => {
    expect(
      planProjectRemoval({
        memberships: [],
        projectId: "proj-a",
        defaultProject: project(),
        goal,
      })
    ).toEqual({ kind: "unavailable", reason: "destinationUnknown" })
  })

  it("reports an occupied destination slot for an Active goal", () => {
    expect(
      planProjectRemoval({
        memberships: ["proj-a"],
        projectId: "proj-a",
        defaultProject: project(),
        goal,
        destinationGoals: [member()],
      })
    ).toEqual({
      kind: "conflict",
      conflict: {
        projectId: "proj-default",
        existingGoalId: "goal-other",
        goalTypes: ["Rank"],
      },
      destination: project(),
    })
  })

  it("lets a Completed or Archived goal relocate into an occupied slot", () => {
    for (const status of ["Completed", "Archived"]) {
      expect(
        planProjectRemoval({
          memberships: ["proj-a"],
          projectId: "proj-a",
          defaultProject: project(),
          goal: { ...goal, status },
          destinationGoals: [member()],
        })
      ).toMatchObject({ kind: "relocate", projectIds: ["proj-default"] })
    }
  })

  it("does not treat a historical goal in the destination as a conflict", () => {
    expect(
      planProjectRemoval({
        memberships: ["proj-a"],
        projectId: "proj-a",
        defaultProject: project(),
        goal,
        destinationGoals: [member({ status: "Completed" })],
      })
    ).toMatchObject({ kind: "relocate" })
  })

  it("does not conflict when the destination slot is empty", () => {
    expect(
      planProjectRemoval({
        memberships: ["proj-a"],
        projectId: "proj-a",
        defaultProject: project(),
        goal,
        destinationGoals: [member({ entityId: "hero2" })],
      })
    ).toMatchObject({ kind: "relocate" })
  })
})

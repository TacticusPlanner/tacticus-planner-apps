import { beforeEach, describe, expect, it, vi } from "vitest"

import { ApiError } from "@/shared/api"

const api = vi.hoisted(() => ({
  updateProjectGoals: vi.fn(),
}))

vi.mock("../api/project.api", () => api)

import { changeProjectMembership } from "./change-project-membership"

const addGoals =
  (...goalIds: string[]) =>
  (current: readonly string[]) => [...current, ...goalIds]

describe("changeProjectMembership", () => {
  beforeEach(() => {
    api.updateProjectGoals.mockReset().mockResolvedValue({ goals: [] })
  })

  it("sends the changed set in one request with the caller's membership as expected, reading nothing", async () => {
    const result = await changeProjectMembership(
      "project-1",
      ["goal-1", "goal-2"],
      addGoals("goal-3", "goal-4")
    )

    expect(api.updateProjectGoals).toHaveBeenCalledTimes(1)
    expect(api.updateProjectGoals).toHaveBeenCalledWith("project-1", {
      goals: [
        { goalId: "goal-1" },
        { goalId: "goal-2" },
        { goalId: "goal-3" },
        { goalId: "goal-4" },
      ],
      expectedGoalIds: ["goal-1", "goal-2"],
    })
    expect(result).toEqual({
      before: ["goal-1", "goal-2"],
      after: ["goal-1", "goal-2", "goal-3", "goal-4"],
    })
  })

  it("sends nothing when the change leaves the membership as it is", async () => {
    const result = await changeProjectMembership(
      "project-1",
      ["goal-1", "goal-2"],
      addGoals("goal-2")
    )

    expect(api.updateProjectGoals).not.toHaveBeenCalled()
    expect(result).toEqual({
      before: ["goal-1", "goal-2"],
      after: ["goal-1", "goal-2"],
    })
  })

  it("re-applies the change once to the membership a stale 409 reports", async () => {
    api.updateProjectGoals.mockRejectedValueOnce(
      new ApiError(409, "Stale", {
        issueCode: "membershipStale",
        current: { projectId: "project-1", goalIds: ["goal-1", "goal-9"] },
      })
    )

    const result = await changeProjectMembership(
      "project-1",
      ["goal-1"],
      (current) => current.filter((goalId) => goalId !== "goal-1")
    )

    expect(api.updateProjectGoals).toHaveBeenCalledTimes(2)
    expect(api.updateProjectGoals).toHaveBeenLastCalledWith("project-1", {
      goals: [{ goalId: "goal-9" }],
      expectedGoalIds: ["goal-1", "goal-9"],
    })
    expect(result.after).toEqual(["goal-9"])
  })

  it("throws any other rejection without retrying", async () => {
    const rejection = new ApiError(400, "Only project", {
      issueCode: "lastProjectMembership",
      extensions: { blockedGoalIds: ["goal-1"] },
    })
    api.updateProjectGoals.mockRejectedValueOnce(rejection)

    await expect(
      changeProjectMembership("project-1", ["goal-1"], () => [])
    ).rejects.toBe(rejection)
    expect(api.updateProjectGoals).toHaveBeenCalledTimes(1)
  })
})

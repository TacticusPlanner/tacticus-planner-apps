import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/shared/auth", () => ({
  acquireAccessToken: () => Promise.resolve("access-token"),
}))
vi.mock("@/shared/config", () => ({
  getRequiredEnvironmentValue: () => "https://api.example",
}))

import { lastRequest } from "@/test/last-request"

import {
  createCombinedGoals,
  deleteGoal,
  editGoal,
  getGoal,
  listGoals,
  updateGoalsStatus,
} from "./goal.api"

const fetchMock = () =>
  vi
    .spyOn(globalThis, "fetch")
    .mockImplementation(() =>
      Promise.resolve(new Response("{}", { status: 200 }))
    )

describe("goal API", () => {
  beforeEach(() => vi.restoreAllMocks())

  it("maps goal reads to their endpoints", async () => {
    const fetch = fetchMock()

    await listGoals()
    expect((await lastRequest(fetch)).url).toBe(
      "https://api.example/api/v1/goals"
    )
    await listGoals({ archived: true })
    expect((await lastRequest(fetch)).url).toBe(
      "https://api.example/api/v1/goals?archived=true"
    )
    await getGoal("goal-1")
    expect((await lastRequest(fetch)).url).toBe(
      "https://api.example/api/v1/goals/goal-1"
    )
  })

  it("maps goal writes to their endpoints", async () => {
    const fetch = fetchMock()
    const combined = {
      entityType: "Character" as const,
      entityId: "hero",
      projects: null,
      goals: [],
    }

    await createCombinedGoals(combined)
    expect(await lastRequest(fetch)).toMatchObject({
      method: "POST",
      url: "https://api.example/api/v1/goals",
      body: combined,
    })

    await updateGoalsStatus({
      goalIds: ["goal-1", "goal-2"],
      status: "Completed",
      expectedOrderRevision: 4,
    })
    expect(await lastRequest(fetch)).toMatchObject({
      method: "POST",
      url: "https://api.example/api/v1/goals/status",
      body: {
        goalIds: ["goal-1", "goal-2"],
        status: "Completed",
        expectedOrderRevision: 4,
      },
    })

    await deleteGoal("goal-1")
    expect(await lastRequest(fetch)).toMatchObject({
      method: "DELETE",
      url: "https://api.example/api/v1/goals/goal-1",
    })
  })

  it("sends a target edit as the target section of the single edit route", async () => {
    const fetch = fetchMock()
    const target = {
      expectedRevision: 7,
      target: { rank: { end: 7, endPointFive: true, endAppliedUpgrades: 0 } },
    }

    await editGoal("goal-1", { target })

    expect(await lastRequest(fetch)).toMatchObject({
      method: "PUT",
      url: "https://api.example/api/v1/goals/goal-1",
      body: { target },
    })
  })

  it("sends only the present sections of a goal edit", async () => {
    const fetch = fetchMock()

    await editGoal("goal-1", {
      priority: { position: 2, expectedOrderRevision: 7 },
    })

    expect((await lastRequest(fetch)).body).toEqual({
      priority: { position: 2, expectedOrderRevision: 7 },
    })
  })
})

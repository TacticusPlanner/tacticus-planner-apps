import { beforeEach, describe, expect, it, vi } from "vitest"

const api = vi.hoisted(() => ({
  delete: vi.fn(),
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
}))

vi.mock("@/shared/api", () => ({
  apiDelete: api.delete,
  apiGet: api.get,
  apiPost: api.post,
  apiPut: api.put,
}))

import type { CreateTeamRequest, UpdateTeamRequest } from "../model/plan.types"
import {
  createLegendaryEventTeam,
  deleteLegendaryEventTeam,
  getLegendaryEventPlan,
  updateLegendaryEventPlan,
  updateLegendaryEventTeam,
  updateLegendaryEventTeamOrder,
} from "./legendary-event-plan.api"
import { legendaryEventPlanQueries } from "./legendary-event-plan.queries"

const BASE = "/api/v1/me/legendary-event-plans/astarLysander"

const team: UpdateTeamRequest = {
  expectedRevision: 2,
  name: "Melee",
  memberUnitIds: ["u1", "u2"],
  reserveUnitId: null,
  objectiveIndexes: [0, 3],
  run: 1,
  expectedBattleClears: 7,
  expectedBattleClearsSource: "manual",
}

describe("legendary event plan API", () => {
  beforeEach(() => vi.clearAllMocks())

  it("reads the plan of one event", () => {
    const signal = new AbortController().signal
    getLegendaryEventPlan("astarLysander", signal)
    expect(api.get).toHaveBeenCalledWith(BASE, { signal })
  })

  it("writes the plan-level fields", () => {
    const body = {
      expectedRevision: 0,
      notes: "Alpha first",
      showPaidOptions: true,
    }
    updateLegendaryEventPlan("astarLysander", body)
    expect(api.put).toHaveBeenCalledWith(BASE, { body })
  })

  it("creates a team with its lane and run", () => {
    const body: CreateTeamRequest = { ...team, laneId: "alpha" }
    createLegendaryEventTeam("astarLysander", body)
    expect(api.post).toHaveBeenCalledWith(`${BASE}/teams`, { body })
  })

  it("updates a team without a lane", () => {
    updateLegendaryEventTeam("astarLysander", "team-1", team)
    expect(api.put).toHaveBeenCalledWith(`${BASE}/teams/team-1`, {
      body: team,
    })
    expect(api.put.mock.calls[0][1].body).not.toHaveProperty("laneId")
  })

  it("deletes a team with the revision as a query parameter", () => {
    deleteLegendaryEventTeam("astarLysander", "team-1", 5)
    expect(api.delete).toHaveBeenCalledWith(
      `${BASE}/teams/team-1?expectedRevision=5`,
      {}
    )
  })

  it("replaces a lane's order", () => {
    const body = {
      expectedRevision: 4,
      laneId: "alpha" as const,
      teamIds: ["c", "a", "b"],
    }
    updateLegendaryEventTeamOrder("astarLysander", body)
    expect(api.put).toHaveBeenCalledWith(`${BASE}/teams/order`, { body })
  })

  it("keys the plan query per event under one root", () => {
    expect(legendaryEventPlanQueries.detail("astarLysander").queryKey).toEqual([
      ...legendaryEventPlanQueries.all(),
      "astarLysander",
    ])
  })
})

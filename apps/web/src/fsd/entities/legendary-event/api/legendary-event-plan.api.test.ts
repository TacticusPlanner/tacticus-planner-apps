import { QueryClient } from "@tanstack/react-query"
import { beforeEach, describe, expect, it, vi } from "vitest"

const api = vi.hoisted(() => ({
  delete: vi.fn(),
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
}))

vi.mock("@/shared/api", () => ({
  ApiError: class ApiError extends Error {
    constructor(
      readonly status: number,
      message: string
    ) {
      super(message)
    }
  },
  apiDelete: api.delete,
  apiGet: api.get,
  apiPost: api.post,
  apiPut: api.put,
}))

import type {
  CreateTeamRequestDto,
  LegendaryEventPlan,
  UpdateTeamRequestDto,
} from "../model/plan.types"
import { ApiError } from "@/shared/api"

import {
  createLegendaryEventTeam,
  deleteLegendaryEventTeam,
  getLegendaryEventPlan,
  getLegendaryEventRunRecords,
  listLegendaryEventPlans,
  updateLegendaryEventAnnotations,
  updateLegendaryEventPlan,
  updateLegendaryEventRunInputs,
  updateLegendaryEventTeam,
  updateLegendaryEventTeamOrder,
} from "./legendary-event-plan.api"
import { legendaryEventPlanQueries } from "./legendary-event-plan.queries"

const BASE = "/api/v1/me/legendary-event-plans/astarLysander"

const team: UpdateTeamRequestDto = {
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
    const body: CreateTeamRequestDto = { ...team, laneId: "alpha" }
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

  it("writes one run's inputs under its run number", () => {
    const body = {
      expectedRevision: 6,
      regularMissions: 10,
      premiumMissions: 0,
      bundlePurchased: true,
      closeShards: 25,
    }
    updateLegendaryEventRunInputs("astarLysander", 3, body)
    expect(api.put).toHaveBeenCalledWith(`${BASE}/runs/3`, { body })
  })

  it("writes the marks of one battle", () => {
    const body = {
      expectedRevision: 7,
      laneId: "alpha" as const,
      battleIndex: 8,
      objectiveIds: [0, 1, 3, 4, 5],
      status: "maybeClear" as const,
    }
    updateLegendaryEventAnnotations("astarLysander", body)
    expect(api.put).toHaveBeenCalledWith(`${BASE}/annotations`, { body })

    const clear = { ...body, objectiveIds: [3], status: null }
    updateLegendaryEventAnnotations("astarLysander", clear)
    expect(api.put).toHaveBeenLastCalledWith(`${BASE}/annotations`, {
      body: clear,
    })
  })

  it("keys the plan query per event under one root", () => {
    expect(legendaryEventPlanQueries.detail("astarLysander").queryKey).toEqual([
      ...legendaryEventPlanQueries.all(),
      "astarLysander",
    ])
  })

  it("keeps a cached plan newer than a refetched one, and adopts a newer refetch", async () => {
    const plan = (revision: number): LegendaryEventPlan => ({
      eventId: "astarLysander",
      revision,
      catalogVersion: "1",
      notes: null,
      showPaidOptions: false,
      teams: [],
    })
    const client = new QueryClient()
    const options = legendaryEventPlanQueries.detail("astarLysander")
    client.setQueryData(options.queryKey, plan(5))

    api.get.mockResolvedValueOnce(plan(4))
    await client.fetchQuery({ ...options, staleTime: 0 })
    expect(client.getQueryData(options.queryKey)?.revision).toBe(5)

    api.get.mockResolvedValueOnce(plan(6))
    await client.fetchQuery({ ...options, staleTime: 0 })
    expect(client.getQueryData(options.queryKey)?.revision).toBe(6)
  })

  it("lists every stored plan", () => {
    const signal = new AbortController().signal
    listLegendaryEventPlans(signal)
    expect(api.get).toHaveBeenCalledWith("/api/v1/me/legendary-event-plans", {
      signal,
    })
  })

  it("reads one event's run records", () => {
    const signal = new AbortController().signal
    getLegendaryEventRunRecords("astarLysander", signal)
    expect(api.get).toHaveBeenCalledWith(`${BASE}/run-records`, { signal })
  })

  it("reads run records newest first, and a 404 as no records", async () => {
    const client = new QueryClient()
    const options = legendaryEventPlanQueries.runRecords("astarLysander")
    api.get.mockResolvedValueOnce({
      eventId: "astarLysander",
      records: [{ id: "r2" }, { id: "r1" }],
    })
    expect(
      (await client.fetchQuery(options)).map((record) => record.id)
    ).toEqual(["r2", "r1"])

    api.get.mockRejectedValueOnce(new ApiError(404, "not found"))
    expect(await client.fetchQuery({ ...options, staleTime: 0 })).toEqual([])

    api.get.mockRejectedValueOnce(new ApiError(500, "boom"))
    await expect(
      client.fetchQuery({ ...options, staleTime: 0, retry: false })
    ).rejects.toThrow("boom")
  })

  it("keeps the list under the plans root and seeds uncached plans from it", async () => {
    const plan = (eventId: string, revision: number): LegendaryEventPlan => ({
      eventId,
      revision,
      catalogVersion: "1",
      notes: null,
      showPaidOptions: false,
      teams: [],
    })
    const client = new QueryClient()
    const list = legendaryEventPlanQueries.list()
    expect(list.queryKey.slice(0, 1)).toEqual(legendaryEventPlanQueries.all())
    const uthar = legendaryEventPlanQueries.detail("votanUthar").queryKey
    client.setQueryData(uthar, plan("votanUthar", 9))

    api.get.mockResolvedValueOnce({
      plans: [plan("astarLysander", 2), plan("votanUthar", 6)],
    })
    expect(await client.fetchQuery(list)).toHaveLength(2)
    expect(
      client.getQueryData(
        legendaryEventPlanQueries.detail("astarLysander").queryKey
      )?.revision
    ).toBe(2)
    expect(client.getQueryData(uthar)?.revision).toBe(9)
  })
})

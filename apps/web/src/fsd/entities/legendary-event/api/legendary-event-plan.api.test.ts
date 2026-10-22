import { QueryClient } from "@tanstack/react-query"
import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/shared/auth", () => ({
  acquireAccessToken: () => Promise.resolve("access-token"),
}))
vi.mock("@/shared/config", () => ({
  getRequiredEnvironmentValue: () => "https://api.example",
}))

import { lastRequest } from "@/test/last-request"

import type {
  CreateTeamRequestDto,
  LegendaryEventPlan,
  UpdateTeamRequestDto,
} from "../model/plan.types"

import {
  createLegendaryEventTeam,
  deleteLegendaryEventTeam,
  getLegendaryEventPlan,
  getLegendaryEventRunRecordRoster,
  getLegendaryEventRunRecords,
  listLegendaryEventPlans,
  updateLegendaryEventAnnotations,
  updateLegendaryEventPlan,
  updateLegendaryEventRunInputs,
  updateLegendaryEventTeam,
  updateLegendaryEventTeamOrder,
} from "./legendary-event-plan.api"
import { legendaryEventPlanQueries } from "./legendary-event-plan.queries"

const BASE = "https://api.example/api/v1/legendary-event-plans/astarLysander"

const plan = (revision = 1, eventId = "astarLysander"): LegendaryEventPlan => ({
  eventId,
  revision,
  catalogVersion: "1",
  notes: null,
  showPaidOptions: false,
  teams: [],
  runs: [],
  annotations: [],
})

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

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })

/** Every request answers `body` (a plan by default) unless a test queues its own responses. */
const fetchMock = (body: unknown = plan()) =>
  vi
    .spyOn(globalThis, "fetch")
    .mockImplementation(() => Promise.resolve(json(body)))

describe("legendary event plan API", () => {
  beforeEach(() => vi.restoreAllMocks())

  it("reads the plan of one event", async () => {
    const fetch = fetchMock()
    expect(await getLegendaryEventPlan("astarLysander")).toEqual(plan())
    expect(await lastRequest(fetch)).toMatchObject({ method: "GET", url: BASE })
  })

  it("rejects a plan whose run is outside 1-3", async () => {
    fetchMock({
      ...plan(),
      runs: [
        {
          run: 4,
          regularMissions: 0,
          premiumMissions: 0,
          completedRegularMissions: [],
          completedPremiumMissions: [],
          bundlePurchased: false,
          closeShards: 0,
          updatedAt: "2026-10-10T00:00:00Z",
        },
      ],
    })
    await expect(getLegendaryEventPlan("astarLysander")).rejects.toThrow(
      "Unexpected Legendary Event run 4"
    )
  })

  it("writes the plan-level fields", async () => {
    const fetch = fetchMock()
    const body = {
      expectedRevision: 0,
      notes: "Alpha first",
      showPaidOptions: true,
    }
    await updateLegendaryEventPlan("astarLysander", body)
    expect(await lastRequest(fetch)).toMatchObject({
      method: "PUT",
      url: BASE,
      body,
    })
  })

  it("creates a team with its lane and run", async () => {
    const fetch = fetchMock()
    const body: CreateTeamRequestDto = { ...team, laneId: "alpha" }
    await createLegendaryEventTeam("astarLysander", body)
    expect(await lastRequest(fetch)).toMatchObject({
      method: "POST",
      url: `${BASE}/teams`,
      body,
    })
  })

  it("updates a team without a lane", async () => {
    const fetch = fetchMock()
    await updateLegendaryEventTeam("astarLysander", "team-1", team)
    const request = await lastRequest(fetch)
    expect(request).toMatchObject({
      method: "PUT",
      url: `${BASE}/teams/team-1`,
      body: team,
    })
    expect(request.body).not.toHaveProperty("laneId")
  })

  it("deletes a team with the revision as a query parameter", async () => {
    const fetch = fetchMock()
    await deleteLegendaryEventTeam("astarLysander", "team-1", 5)
    expect(await lastRequest(fetch)).toMatchObject({
      method: "DELETE",
      url: `${BASE}/teams/team-1?expectedRevision=5`,
    })
  })

  it("replaces a lane's order", async () => {
    const fetch = fetchMock()
    const body = {
      expectedRevision: 4,
      laneId: "alpha" as const,
      teamIds: ["c", "a", "b"],
    }
    await updateLegendaryEventTeamOrder("astarLysander", body)
    expect(await lastRequest(fetch)).toMatchObject({
      method: "PUT",
      url: `${BASE}/teams/order`,
      body,
    })
  })

  it("writes one run's inputs under its run number", async () => {
    const fetch = fetchMock()
    const body = {
      expectedRevision: 6,
      regularMissions: 10,
      premiumMissions: 0,
      bundlePurchased: true,
      closeShards: 25,
      completedRegularMissions: [0, 3],
      completedPremiumMissions: [],
    }
    await updateLegendaryEventRunInputs("astarLysander", 3, body)
    expect(await lastRequest(fetch)).toMatchObject({
      method: "PUT",
      url: `${BASE}/runs/3`,
      body,
    })
  })

  it("writes the marks of one battle", async () => {
    const fetch = fetchMock()
    const body = {
      expectedRevision: 7,
      laneId: "alpha" as const,
      battleIndex: 8,
      objectiveIds: [0, 1, 3, 4, 5],
      status: "maybeClear" as const,
    }
    await updateLegendaryEventAnnotations("astarLysander", body)
    expect(await lastRequest(fetch)).toMatchObject({
      method: "PUT",
      url: `${BASE}/annotations`,
      body,
    })

    const clear = { ...body, objectiveIds: [3], status: null }
    await updateLegendaryEventAnnotations("astarLysander", clear)
    expect((await lastRequest(fetch)).body).toEqual(clear)
  })

  it("keys the plan query per event under one root", () => {
    expect(legendaryEventPlanQueries.detail("astarLysander").queryKey).toEqual([
      ...legendaryEventPlanQueries.all(),
      "astarLysander",
    ])
  })

  it("keeps a cached plan newer than a refetched one, and adopts a newer refetch", async () => {
    const fetch = fetchMock()
    const client = new QueryClient()
    const options = legendaryEventPlanQueries.detail("astarLysander")
    client.setQueryData(options.queryKey, plan(5))

    fetch.mockResolvedValueOnce(json(plan(4)))
    await client.fetchQuery({ ...options, staleTime: 0 })
    expect(client.getQueryData(options.queryKey)?.revision).toBe(5)

    fetch.mockResolvedValueOnce(json(plan(6)))
    await client.fetchQuery({ ...options, staleTime: 0 })
    expect(client.getQueryData(options.queryKey)?.revision).toBe(6)
  })

  it("lists every stored plan", async () => {
    const fetch = fetchMock({ plans: [plan()] })
    expect(await listLegendaryEventPlans()).toEqual({ plans: [plan()] })
    expect((await lastRequest(fetch)).url).toBe(
      "https://api.example/api/v1/legendary-event-plans"
    )
  })

  it("reads one page of an event's run records, with the cursor of the previous page", async () => {
    const fetch = fetchMock({
      eventId: "astarLysander",
      records: [],
      nextAfter: null,
    })
    await getLegendaryEventRunRecords("astarLysander")
    expect((await lastRequest(fetch)).url).toBe(`${BASE}/run-records`)
    await getLegendaryEventRunRecords("astarLysander", {
      after: "v1|cursor",
      limit: 10,
    })
    expect((await lastRequest(fetch)).url).toBe(
      `${BASE}/run-records?limit=10&after=v1%7Ccursor`
    )
  })

  it("reads one record's roster on its own route", async () => {
    const fetch = fetchMock({})
    await getLegendaryEventRunRecordRoster("astarLysander", "r1")
    expect((await lastRequest(fetch)).url).toBe(`${BASE}/run-records/r1/roster`)
  })

  it("pages run records by the previous page's cursor, a 404 as no records, and keys rosters under the records", async () => {
    const fetch = fetchMock()
    const client = new QueryClient()
    const options = legendaryEventPlanQueries.runRecords("astarLysander")
    const record = (id: string) => ({ id, run: 1 })
    fetch
      .mockResolvedValueOnce(
        json({
          eventId: "astarLysander",
          records: [record("r3"), record("r2")],
          nextAfter: "v1|r2",
        })
      )
      .mockResolvedValueOnce(
        json({
          eventId: "astarLysander",
          records: [record("r1")],
          nextAfter: null,
        })
      )
    const pages = await client.fetchInfiniteQuery({ ...options, pages: 2 })
    expect(
      pages.pages.flatMap((page) => page.records.map((record) => record.id))
    ).toEqual(["r3", "r2", "r1"])
    expect((await lastRequest(fetch)).url).toBe(
      `${BASE}/run-records?after=v1%7Cr2`
    )

    fetch.mockResolvedValueOnce(json({ title: "not found" }, 404))
    expect(
      (await client.fetchInfiniteQuery({ ...options, staleTime: 0 })).pages
    ).toEqual([{ eventId: "astarLysander", records: [], nextAfter: null }])

    fetch.mockResolvedValueOnce(json({ detail: "boom" }, 500))
    await expect(
      client.fetchInfiniteQuery({ ...options, staleTime: 0, retry: false })
    ).rejects.toThrow("boom")

    expect(
      legendaryEventPlanQueries
        .runRecordRoster("astarLysander", "r1")
        .queryKey.slice(0, 2)
    ).toEqual(options.queryKey)
  })

  it("keeps the list under the plans root and seeds uncached plans from it", async () => {
    fetchMock({
      plans: [plan(2, "astarLysander"), plan(6, "votanUthar")],
    })
    const client = new QueryClient()
    const list = legendaryEventPlanQueries.list()
    expect(list.queryKey.slice(0, 1)).toEqual(legendaryEventPlanQueries.all())
    const uthar = legendaryEventPlanQueries.detail("votanUthar").queryKey
    client.setQueryData(uthar, plan(9, "votanUthar"))

    expect(await client.fetchQuery(list)).toHaveLength(2)
    expect(
      client.getQueryData(
        legendaryEventPlanQueries.detail("astarLysander").queryKey
      )?.revision
    ).toBe(2)
    expect(client.getQueryData(uthar)?.revision).toBe(9)
  })
})

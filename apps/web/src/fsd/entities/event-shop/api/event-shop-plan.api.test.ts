import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/shared/auth", () => ({
  acquireAccessToken: () => Promise.resolve("access-token"),
}))
vi.mock("@/shared/config", () => ({
  getRequiredEnvironmentValue: () => "https://api.example",
}))

import { lastRequest } from "@/test/last-request"

import {
  eventShopPlanConflict,
  toPutEventShopPlanRequest,
  type EventShopCartEntry,
} from "../model/plan.types"
import {
  getEventShopPlan,
  listEventShopPlans,
  putEventShopPlan,
} from "./event-shop-plan.api"

const BASE = "https://api.example/api/v1/event-shop-plans"

const yarrick: EventShopCartEntry = {
  week: 1,
  day: "THU",
  slotIndex: 1,
  rewardType: "shards_astraYarrick",
  quantity: 2,
  purchasedQuantity: 1,
  draftAlliance: null,
}

const plan = (revision = 1, entries: unknown[] = [yarrick]) => ({
  eventId: "october-2026",
  revision,
  catalogVersion: revision === 0 ? null : "1.43",
  entries,
})

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type":
        status >= 400 ? "application/problem+json" : "application/json",
    },
  })

const fetchMock = (body: unknown = plan(), status = 200) =>
  vi
    .spyOn(globalThis, "fetch")
    .mockImplementation(() => Promise.resolve(json(body, status)))

describe("event shop plan API", () => {
  beforeEach(() => vi.restoreAllMocks())

  it("reads the plan of one event", async () => {
    const fetch = fetchMock()

    expect(await getEventShopPlan("october-2026")).toEqual(plan())
    expect(await lastRequest(fetch)).toMatchObject({
      method: "GET",
      url: `${BASE}/october-2026`,
    })
  })

  it("reads a plan never written as revision 0 with no entries", async () => {
    fetchMock(plan(0, []))

    expect(await getEventShopPlan("october-2026")).toEqual({
      eventId: "october-2026",
      revision: 0,
      catalogVersion: null,
      entries: [],
    })
  })

  it("lists every stored plan", async () => {
    fetchMock({ plans: [plan()] })

    expect(await listEventShopPlans()).toEqual([plan()])
  })

  it("replaces the whole cart with the expected revision", async () => {
    const fetch = fetchMock(plan(2))

    const saved = await putEventShopPlan(
      "october-2026",
      toPutEventShopPlanRequest(1, [yarrick])
    )

    expect(saved.revision).toBe(2)
    expect(await lastRequest(fetch)).toMatchObject({
      method: "PUT",
      url: `${BASE}/october-2026`,
      body: { expectedRevision: 1, entries: [yarrick] },
    })
  })

  it("rejects a plan with an unknown day or alliance", async () => {
    fetchMock(plan(1, [{ ...yarrick, day: "MONDAY" }]))
    await expect(getEventShopPlan("october-2026")).rejects.toThrow(
      "Unexpected event shop day MONDAY"
    )

    vi.restoreAllMocks()
    fetchMock(plan(1, [{ ...yarrick, draftAlliance: "orks" }]))
    await expect(getEventShopPlan("october-2026")).rejects.toThrow(
      "Unexpected draft alliance orks"
    )
  })

  it("turns a stale write into the current plan", async () => {
    fetchMock(
      {
        title: "Conflict",
        status: 409,
        issueCode: "eventShopPlanStale",
        current: plan(4),
      },
      409
    )

    const error: unknown = await putEventShopPlan(
      "october-2026",
      toPutEventShopPlanRequest(3, [])
    ).catch((caught: unknown) => caught)

    expect(eventShopPlanConflict(error)).toEqual({ current: plan(4) })
    expect(eventShopPlanConflict(new Error("other"))).toBeNull()
  })
})

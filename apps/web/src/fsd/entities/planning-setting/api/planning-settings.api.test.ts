import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/shared/auth", () => ({
  acquireAccessToken: () => Promise.resolve("access-token"),
}))
vi.mock("@/shared/config", () => ({
  getRequiredEnvironmentValue: () => "https://api.example",
}))

import { lastRequest } from "@/test/last-request"

import {
  getPlanningSettings,
  updatePlanningSettings,
} from "./planning-settings.api"

const respond = (body: unknown) =>
  vi
    .spyOn(globalThis, "fetch")
    .mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify(body), { status: 200 }))
    )

describe("planning settings API", () => {
  beforeEach(() => vi.restoreAllMocks())

  it("reads the settings", async () => {
    const settings = {
      dailyEnergy: 378,
      xpBookRarity: "Epic",
      goalsView: "Table",
      revision: 2,
    }
    const fetch = respond(settings)

    expect(await getPlanningSettings()).toEqual(settings)
    expect((await lastRequest(fetch)).url).toBe(
      "https://api.example/api/v1/settings"
    )
  })

  it("writes the settings", async () => {
    const settings = {
      dailyEnergy: 288,
      xpBookRarity: "Epic" as const,
      goalsView: "Table" as const,
      revision: 1,
    }
    const fetch = respond({ ...settings, revision: 2 })

    expect(await updatePlanningSettings(settings)).toEqual({
      ...settings,
      revision: 2,
    })
    expect(await lastRequest(fetch)).toMatchObject({
      method: "PUT",
      url: "https://api.example/api/v1/settings",
      body: settings,
    })
  })
})

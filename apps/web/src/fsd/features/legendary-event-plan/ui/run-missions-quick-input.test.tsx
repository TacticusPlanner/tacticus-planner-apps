import type { i18n as I18n } from "i18next"
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

import type {
  LegendaryEventPlan,
  LegendaryEventRunInputs,
} from "@/entities/legendary-event"
import { utharEvent } from "@/test/fixtures/legendary-events"
import { createTestI18n, i18nWrapper } from "@/test/i18n"
import { act, fireEvent, render, screen } from "@/test/render"

import { RunMissionsQuickInput } from "./run-missions-quick-input"

const api = vi.hoisted(() => ({ plan: undefined as unknown, put: vi.fn() }))

vi.mock("@azure/msal-react", () => ({ useIsAuthenticated: () => true }))
vi.mock("@/shared/api", async (importOriginal) => {
  const { fakeApiClient } = await import("@/test/fake-api-client")
  return {
    ...(await importOriginal<typeof import("@/shared/api")>()),
    apiClient: fakeApiClient((call) =>
      call.method === "PUT"
        ? api.put({ path: call.path, params: call.params, body: call.body })
        : api.plan
    ),
  }
})

const stored = (
  fields: Partial<LegendaryEventRunInputs> = {}
): LegendaryEventRunInputs => ({
  run: 2,
  regularMissions: 0,
  premiumMissions: 0,
  bundlePurchased: false,
  closeShards: 0,
  completedRegularMissions: [],
  completedPremiumMissions: [],
  updatedAt: "2026-10-10T00:00:00Z",
  ...fields,
})

const plan = (
  fields: Partial<LegendaryEventPlan> = {}
): LegendaryEventPlan => ({
  eventId: "votanUthar",
  revision: 2,
  catalogVersion: "1",
  notes: "",
  showPaidOptions: false,
  teams: [],
  runs: [stored()],
  annotations: [],
  ...fields,
})

let i18n: I18n

describe("RunMissionsQuickInput", () => {
  beforeAll(async () => {
    i18n = await createTestI18n("en")
  })
  beforeEach(() => {
    api.plan = plan()
    api.put.mockReset()
  })

  it("ticks the run's regular missions and saves them like the drawer", async () => {
    api.put.mockResolvedValue(plan({ revision: 3 }))
    render(<RunMissionsQuickInput event={utharEvent} run={2} touch={false} />, {
      wrapper: i18nWrapper(i18n),
    })
    const tick = await screen.findByRole("checkbox", {
      name: "Defeat 30 Necrons",
    })
    expect(screen.queryByTestId("quick-missions-premium")).toBeNull()

    fireEvent.click(tick)
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 700))
    })
    expect(api.put).toHaveBeenCalledWith({
      path: "/api/v1/legendary-event-plans/{eventId}/runs/{run}",
      params: { path: { eventId: "votanUthar", run: "2" } },
      body: expect.objectContaining({
        regularMissions: 1,
        completedRegularMissions: [1],
      }),
    })
  })

  it("adds the premium missions with Show paid options on", async () => {
    api.plan = plan({ showPaidOptions: true })
    render(<RunMissionsQuickInput event={utharEvent} run={2} touch={false} />, {
      wrapper: i18nWrapper(i18n),
    })

    expect(
      await screen.findByTestId("quick-missions-premium")
    ).toBeInTheDocument()
  })
})

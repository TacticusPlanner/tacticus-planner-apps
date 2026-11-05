import type { i18n as I18n } from "i18next"
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

import type {
  LegendaryEventPlan,
  LegendaryEventRunInputs,
  LegendaryEventRunResolution,
} from "@/entities/legendary-event"
import { utharEvent } from "@/test/fixtures/legendary-events"
import { createTestI18n, i18nWrapper } from "@/test/i18n"
import { act, fireEvent, render, screen, within } from "@/test/render"

import { RunInputsDrawer } from "./run-inputs-drawer"

const api = vi.hoisted(() => ({
  plan: undefined as unknown,
  settings: undefined as unknown,
  put: vi.fn(),
}))

vi.mock("@azure/msal-react", () => ({ useIsAuthenticated: () => true }))
vi.mock("@/shared/api", async (importOriginal) => {
  const { fakeApiClient } = await import("@/test/fake-api-client")
  return {
    ...(await importOriginal<typeof import("@/shared/api")>()),
    apiClient: fakeApiClient((call) =>
      call.method === "PUT"
        ? api.put({ path: call.path, params: call.params, body: call.body })
        : call.path === "/api/v1/settings"
          ? api.settings
          : api.plan
    ),
  }
})

const stored = (
  run: 1 | 2 | 3,
  fields: Partial<LegendaryEventRunInputs> = {}
): LegendaryEventRunInputs => ({
  run,
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
  notes: "Beta last",
  showPaidOptions: false,
  teams: [],
  runs: [stored(1, { regularMissions: 10 })],
  annotations: [],
  ...fields,
})

let i18n: I18n

const SETTINGS = {
  dailyEnergy: 288,
  xpBookRarity: "Legendary",
  preferences: [] as string[],
  revision: 4,
}
const PAID_SETTINGS = {
  ...SETTINGS,
  preferences: ["LegendaryEventShowPaidOptions"],
}

const RUN_2_ACTIVE: LegendaryEventRunResolution = {
  kind: "known",
  endedRuns: 1,
  currentRun: 2,
  nextRun: 3,
  nextStartMs: null,
}

async function openDrawer(runs: LegendaryEventRunResolution = RUN_2_ACTIVE) {
  render(<RunInputsDrawer event={utharEvent} isMobile={false} runs={runs} />, {
    wrapper: i18nWrapper(i18n),
  })
  const trigger = screen.getByTestId("legendary-event-run-inputs")
  trigger.focus()
  fireEvent.click(trigger)
  const drawer = await screen.findByTestId("run-inputs-drawer")
  // The plan loads behind a skeleton.
  await within(drawer).findAllByTestId("run-inputs-run")
  return drawer
}

const runBlock = (run: number) =>
  screen
    .getAllByTestId("run-inputs-run")
    .find((block) => block.dataset.run === String(run))!
const stepperIn = (block: HTMLElement, testId: string) =>
  within(within(block).getByTestId(testId))

describe("RunInputsDrawer", () => {
  beforeAll(async () => {
    i18n = await createTestI18n("en")
  })
  beforeEach(() => {
    api.plan = plan()
    api.settings = SETTINGS
    api.put.mockReset()
  })

  it("shows only the current run, labelled Now, with all free missions planned by default", async () => {
    const drawer = await openDrawer(RUN_2_ACTIVE)

    expect(within(drawer).getByText("Run inputs")).toBeInTheDocument()
    expect(
      screen.getAllByTestId("run-inputs-run").map((block) => block.dataset.run)
    ).toEqual(["2"])
    expect(
      within(runBlock(2)).getByTestId("run-inputs-phase").textContent
    ).toBe("Now")
    expect(
      within(runBlock(2)).getByTestId("run-inputs-now-hint")
    ).toBeInTheDocument()
    // Run 2 has no stored inputs: 0 done, all 10 free missions planned.
    expect(
      stepperIn(runBlock(2), "run-inputs-regular-done")
        .getByTestId("number-stepper-input")
        .getAttribute("value")
    ).toBe("0")
    expect(
      stepperIn(runBlock(2), "run-inputs-regular-count")
        .getByTestId("number-stepper-input")
        .getAttribute("value")
    ).toBe("10")
  })

  it("shows the next run between runs 2 and 3, labelled Planned, with no now hint", async () => {
    await openDrawer({
      kind: "known",
      endedRuns: 2,
      currentRun: null,
      nextRun: 3,
      nextStartMs: null,
    })

    expect(
      screen.getAllByTestId("run-inputs-run").map((block) => block.dataset.run)
    ).toEqual(["3"])
    expect(
      within(runBlock(3)).getByTestId("run-inputs-phase").textContent
    ).toBe("Planned")
    expect(screen.queryByTestId("run-inputs-now-hint")).toBeNull()
  })

  it("lists every run, unlabelled, while the run is unknown", async () => {
    await openDrawer({
      kind: "unknown",
      endedRuns: null,
      currentRun: null,
      nextRun: null,
      nextStartMs: null,
    })

    expect(screen.queryAllByTestId("run-inputs-phase")).toEqual([])
    expect(screen.queryByTestId("run-inputs-now-hint")).toBeNull()
    expect(
      screen.getAllByTestId("run-inputs-run").map((block) => block.dataset.run)
    ).toEqual(["1", "2", "3"])
  })

  it("shows only regular missions while Show paid options is off, with no settings switches", async () => {
    const drawer = await openDrawer()

    expect(within(drawer).getAllByTestId("run-inputs-regular")).toHaveLength(1)
    expect(within(drawer).queryByTestId("run-inputs-premium")).toBeNull()
    expect(within(drawer).queryByTestId("run-inputs-bundle")).toBeNull()
    expect(within(drawer).queryByTestId("run-inputs-close-shards")).toBeNull()
    // Show paid options and Watch daily ads live in Legendary Event settings now.
    expect(
      within(drawer).queryByRole("switch", { name: "Show paid options" })
    ).toBeNull()
    expect(
      within(drawer).queryByRole("switch", { name: "Watch daily ads" })
    ).toBeNull()
  })

  it("shows every paid field with the account's Show paid options on", async () => {
    api.settings = PAID_SETTINGS
    await openDrawer()

    const block = runBlock(2)
    await within(block).findByTestId("run-inputs-premium")
    expect(within(block).getByTestId("run-inputs-bundle")).toBeInTheDocument()
    expect(
      within(block).getByTestId("run-inputs-close-shards")
    ).toBeInTheDocument()
  })

  it("holds missions and Oh So Close shards at their bounds", async () => {
    api.settings = PAID_SETTINGS
    api.plan = plan({
      runs: [stored(2, { regularMissions: 10, closeShards: 75 })],
    })
    await openDrawer()
    const now = runBlock(2)
    await within(now).findByTestId("run-inputs-close-shards")

    // Uthar has 10 regular missions; V1's bound on close shards is 75.
    const regular = stepperIn(now, "run-inputs-regular-count")
    expect(regular.getByTestId("number-stepper-increase")).toBeDisabled()
    const shards = stepperIn(now, "run-inputs-close-shards")
    expect(shards.getByTestId("number-stepper-increase")).toBeDisabled()
    expect(
      shards.getByTestId("number-stepper-input").getAttribute("value")
    ).toBe("75")
  })

  it("lists the missions in order with the done ones struck through and the current one marked Now", async () => {
    api.plan = plan({
      runs: [
        stored(2, { regularMissions: 5, completedRegularMissions: [0, 1, 2] }),
      ],
    })
    await openDrawer()
    const now = runBlock(2)

    expect(
      within(now).getByTestId("run-inputs-regular-ticked").textContent
    ).toBe("3 of 10 done")
    const states = within(now)
      .getAllByTestId("run-inputs-regular-mission")
      .map((row) => row.dataset.state)
    expect(states).toEqual([
      "done",
      "done",
      "done",
      "current",
      ...Array.from({ length: 6 }, () => "later"),
    ])
    // The current row carries the "Now" label (the run's badge says Now too).
    expect(
      within(now).getAllByTestId("run-inputs-regular-mission")[3]
    ).toHaveTextContent("Now")
  })

  it("sets Done by picking a mission, raises Plan to complete and saves both in one write", async () => {
    api.plan = plan({ runs: [stored(2, { regularMissions: 1 })] })
    api.put.mockResolvedValue(plan({ revision: 3 }))
    await openDrawer()
    const now = runBlock(2)

    fireEvent.click(
      within(now).getAllByTestId("run-inputs-regular-mission")[2]!
        .firstElementChild!
    )

    expect(
      within(now).getByTestId("run-inputs-regular-ticked").textContent
    ).toBe("3 of 10 done")
    expect(
      stepperIn(now, "run-inputs-regular-count")
        .getByTestId("number-stepper-input")
        .getAttribute("value")
    ).toBe("3")
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 700))
    })
    expect(api.put).toHaveBeenCalledTimes(1)
    expect(api.put).toHaveBeenCalledWith({
      path: "/api/v1/legendary-event-plans/{eventId}/runs/{run}",
      params: { path: { eventId: "votanUthar", run: "2" } },
      body: expect.objectContaining({
        regularMissions: 3,
        completedRegularMissions: [0, 1, 2],
      }),
    })
  })

  it("never lets Plan to complete drop below the done missions", async () => {
    api.plan = plan({
      runs: [
        stored(2, { regularMissions: 5, completedRegularMissions: [0, 1, 2] }),
      ],
    })
    await openDrawer()
    const count = stepperIn(runBlock(2), "run-inputs-regular-count")

    for (let press = 0; press < 3; press += 1) {
      fireEvent.click(count.getByTestId("number-stepper-decrease"))
    }

    expect(
      count.getByTestId("number-stepper-input").getAttribute("value")
    ).toBe("3")
    expect(count.getByTestId("number-stepper-decrease")).toBeDisabled()
  })

  it("returns focus to the Inputs button when it closes", async () => {
    const drawer = await openDrawer()

    fireEvent.keyDown(drawer, { key: "Escape" })

    await vi.waitFor(() =>
      expect(screen.queryByTestId("run-inputs-drawer")).toBeNull()
    )
    await vi.waitFor(() =>
      expect(screen.getByTestId("legendary-event-run-inputs")).toHaveFocus()
    )
  })
})

import type { i18n as I18n } from "i18next"
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

import type {
  LegendaryEventPlan,
  LegendaryEventRunInputs,
  LegendaryEventRunResolution,
} from "@/entities/legendary-event"
import { utharEvent } from "@/test/fixtures/legendary-events"
import { createTestI18n, i18nWrapper } from "@/test/i18n"
import { act, fireEvent, render, screen, waitFor, within } from "@/test/render"

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
  watchAds: true,
  revision: 4,
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

  it("labels runs Done, Now and Planned for a run-2 account with the stored values", async () => {
    const drawer = await openDrawer(RUN_2_ACTIVE)

    expect(within(drawer).getByText("Run inputs")).toBeInTheDocument()
    const phases = [1, 2, 3].map(
      (run) => within(runBlock(run)).getByTestId("run-inputs-phase").textContent
    )
    expect(phases).toEqual(["Done", "Now", "Planned"])
    // Only the current run says its inputs wait for the next run in the outlook.
    expect(
      [1, 2, 3].map(
        (run) =>
          within(runBlock(run)).queryByTestId("run-inputs-now-hint") !== null
      )
    ).toEqual([false, true, false])
    const regular = [1, 2, 3].map((run) =>
      stepperIn(runBlock(run), "run-inputs-regular")
        .getByTestId("number-stepper-input")
        .getAttribute("value")
    )
    expect(regular).toEqual(["10", "0", "0"])
  })

  it("labels Uthar's runs Done, Done, Planned between runs 2 and 3, with no now hint", async () => {
    await openDrawer({
      kind: "known",
      endedRuns: 2,
      currentRun: null,
      nextRun: 3,
      nextStartMs: null,
    })

    expect(
      [1, 2, 3].map(
        (run) =>
          within(runBlock(run)).getByTestId("run-inputs-phase").textContent
      )
    ).toEqual(["Done", "Done", "Planned"])
    expect(screen.queryByTestId("run-inputs-now-hint")).toBeNull()
  })

  it("labels no run while the run is unknown, keeping every run editable", async () => {
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
      [1, 2, 3].map(
        (run) => stepperIn(runBlock(run), "run-inputs-regular") !== null
      )
    ).toEqual([true, true, true])
  })

  it("shows only regular missions while Show paid options is off", async () => {
    const drawer = await openDrawer()

    expect(
      within(drawer).getByRole("switch", { name: "Show paid options" })
    ).toHaveAttribute("aria-checked", "false")
    expect(within(drawer).getAllByTestId("run-inputs-regular")).toHaveLength(3)
    expect(within(drawer).queryByTestId("run-inputs-premium")).toBeNull()
    expect(within(drawer).queryByTestId("run-inputs-bundle")).toBeNull()
    expect(within(drawer).queryByTestId("run-inputs-close-shards")).toBeNull()
  })

  it("shows every paid field once Show paid options is on, saving the plan with its notes", async () => {
    api.put.mockResolvedValue(plan({ revision: 3, showPaidOptions: true }))
    const drawer = await openDrawer()

    await act(async () => {
      fireEvent.click(
        within(drawer).getByRole("switch", { name: "Show paid options" })
      )
    })

    expect(api.put).toHaveBeenCalledWith({
      path: "/api/v1/legendary-event-plans/{eventId}",
      params: { path: { eventId: "votanUthar" } },
      body: {
        expectedRevision: 2,
        notes: "Beta last",
        showPaidOptions: true,
      },
    })
    for (const run of [1, 2, 3]) {
      const block = runBlock(run)
      expect(
        within(block).getByTestId("run-inputs-premium")
      ).toBeInTheDocument()
      expect(within(block).getByTestId("run-inputs-bundle")).toBeInTheDocument()
      expect(
        within(block).getByTestId("run-inputs-close-shards")
      ).toBeInTheDocument()
    }
  })

  it("turns Watch daily ads off in the account settings", async () => {
    api.put.mockResolvedValue({ ...SETTINGS, watchAds: false, revision: 5 })
    const drawer = await openDrawer()
    const ads = await within(drawer).findByRole("switch", {
      name: "Watch daily ads",
    })
    expect(ads).toBeChecked()

    await act(async () => {
      fireEvent.click(ads)
    })

    expect(api.put).toHaveBeenCalledWith({
      path: "/api/v1/settings",
      params: undefined,
      body: { ...SETTINGS, watchAds: false },
    })
    // The switch follows the saved settings.
    await waitFor(() =>
      expect(
        within(drawer).getByRole("switch", { name: "Watch daily ads" })
      ).not.toBeChecked()
    )
  })

  it("holds missions and Oh So Close shards at their bounds", async () => {
    api.plan = plan({
      showPaidOptions: true,
      runs: [stored(1, { regularMissions: 10, closeShards: 75 })],
    })
    await openDrawer()
    const first = runBlock(1)

    // Uthar has 10 regular missions; V1's bound on close shards is 75.
    const regular = stepperIn(first, "run-inputs-regular")
    expect(regular.getByTestId("number-stepper-increase")).toBeDisabled()
    const shards = stepperIn(first, "run-inputs-close-shards")
    expect(shards.getByTestId("number-stepper-increase")).toBeDisabled()
    expect(
      shards.getByTestId("number-stepper-input").getAttribute("value")
    ).toBe("75")

    const second = stepperIn(runBlock(2), "run-inputs-close-shards")
    fireEvent.click(second.getByTestId("number-stepper-increase"))
    expect(
      second.getByTestId("number-stepper-input").getAttribute("value")
    ).toBe("25")
  })

  it("ticks missions per run with the Now run expanded and the others collapsed", async () => {
    api.plan = plan({
      runs: [
        stored(1, {
          regularMissions: 10,
          completedRegularMissions: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        }),
      ],
    })
    await openDrawer()

    const ticked = [1, 2, 3].map(
      (run) =>
        within(runBlock(run)).getByTestId("run-inputs-regular-ticked")
          .textContent
    )
    expect(ticked).toEqual(["10 of 10 done", "0 of 10 done", "0 of 10 done"])
    expect(
      [1, 2, 3].map(
        (run) =>
          within(runBlock(run)).queryAllByTestId("run-inputs-regular-mission")
            .length
      )
    ).toEqual([0, 10, 0])
    fireEvent.click(
      within(runBlock(1)).getByTestId("run-inputs-regular-toggle")
    )
    expect(
      within(runBlock(1))
        .getAllByTestId("run-inputs-regular-mission")
        .every((row) => row.dataset.done === "true")
    ).toBe(true)
  })

  it("raises Plan to complete when a tick passes it and saves both in one write", async () => {
    api.put.mockResolvedValue(plan({ revision: 3 }))
    await openDrawer()
    const now = runBlock(2)

    fireEvent.click(
      within(now).getByRole("checkbox", { name: "Defeat 30 Necrons" })
    )

    expect(
      within(now).getByTestId("run-inputs-regular-ticked").textContent
    ).toBe("1 of 10 done")
    const count = stepperIn(now, "run-inputs-regular-count")
    expect(
      count.getByTestId("number-stepper-input").getAttribute("value")
    ).toBe("1")
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 700))
    })
    expect(api.put).toHaveBeenCalledTimes(1)
    expect(api.put).toHaveBeenCalledWith({
      path: "/api/v1/legendary-event-plans/{eventId}/runs/{run}",
      params: { path: { eventId: "votanUthar", run: "2" } },
      body: expect.objectContaining({
        regularMissions: 1,
        completedRegularMissions: [1],
      }),
    })
  })

  it("never lets Plan to complete drop below the ticked missions", async () => {
    api.plan = plan({
      runs: [
        stored(2, { regularMissions: 5, completedRegularMissions: [1, 2, 3] }),
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

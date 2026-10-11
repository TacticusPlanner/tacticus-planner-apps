import type { i18n as I18n } from "i18next"
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

import type {
  LegendaryEventPlan,
  LegendaryEventRunInputs,
} from "@/entities/legendary-event"
import { utharEvent } from "@/test/fixtures/legendary-events"
import { createTestI18n, i18nWrapper } from "@/test/i18n"
import { act, fireEvent, render, screen, within } from "@/test/render"

import { RunInputsDrawer } from "./run-inputs-drawer"

const api = vi.hoisted(() => ({
  plan: undefined as unknown,
  put: vi.fn(),
}))

vi.mock("@azure/msal-react", () => ({ useIsAuthenticated: () => true }))
vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api")>()),
  apiGet: async () => api.plan,
  apiPut: api.put,
}))

const stored = (
  run: 1 | 2 | 3,
  fields: Partial<LegendaryEventRunInputs> = {}
): LegendaryEventRunInputs => ({
  run,
  regularMissions: 0,
  premiumMissions: 0,
  bundlePurchased: false,
  closeShards: 0,
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

async function openDrawer(currentRun: 1 | 2 | 3 = 2) {
  render(
    <RunInputsDrawer
      currentRun={currentRun}
      event={utharEvent}
      isMobile={false}
    />,
    { wrapper: i18nWrapper(i18n) }
  )
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
    api.put.mockReset()
  })

  it("labels runs Done, Now and Planned for a run-2 account with the stored values", async () => {
    const drawer = await openDrawer(2)

    expect(within(drawer).getByText("Run inputs")).toBeInTheDocument()
    const phases = [1, 2, 3].map(
      (run) => within(runBlock(run)).getByTestId("run-inputs-phase").textContent
    )
    expect(phases).toEqual(["Done", "Now", "Planned"])
    const regular = [1, 2, 3].map((run) =>
      stepperIn(runBlock(run), "run-inputs-regular")
        .getByTestId("number-stepper-input")
        .getAttribute("value")
    )
    expect(regular).toEqual(["10", "0", "0"])
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

    expect(api.put).toHaveBeenCalledWith(
      "/api/v1/me/legendary-event-plans/votanUthar",
      {
        body: {
          expectedRevision: 2,
          notes: "Beta last",
          showPaidOptions: true,
        },
      }
    )
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

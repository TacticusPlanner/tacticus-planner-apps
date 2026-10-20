import userEvent from "@testing-library/user-event"
import type { i18n as I18n } from "i18next"
import { createMemoryRouter, RouterProvider } from "react-router"
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

import { utharEvent } from "@/test/fixtures/legendary-events"
import { createTestI18n, i18nWrapper } from "@/test/i18n"
import { render, screen, waitFor, within } from "@/test/render"

import { PlanWizard } from "./plan-wizard"
import { EMPTY_PLAN, RUN_3_START_MS, planInputs } from "./plan.fixtures"
import type { PlanSource } from "./use-plan-source"

const FARMING: { status: string; estimate: () => unknown } = {
  status: "ready",
  estimate: () => ({ days: 10, date: "2026-10-16" }),
}
vi.mock("./use-upgrade-farming-days", () => ({
  useUpgradeFarmingDays: () => FARMING,
}))

const run = vi.fn()
const createState: { items: { key: string; status: string }[] } = {
  items: [],
}
vi.mock("./use-plan-create", () => ({
  usePlanCreate: () => ({ items: createState.items, running: false, run }),
}))

let tourSteps: unknown
vi.mock("@/shared/tour", () => ({
  useTourPageSteps: (steps: unknown) => {
    tourSteps = steps
  },
}))

const capture = vi.fn()
vi.mock("@/shared/analytics", () => ({
  useAnalyticsActions: () => ({ captureEvent: capture }),
}))

vi.mock("@/entities/project", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/project")>()),
  useProjects: () => ({ projects: [], loading: false }),
}))

const SOURCE: Extract<PlanSource, { status: "ready" }> = {
  status: "ready",
  event: utharEvent,
  inputs: planInputs(),
  runDates: {
    starts: [],
    deadlineMs: RUN_3_START_MS + 7 * 24 * 60 * 60 * 1000,
    deadlineEstimated: true,
  },
  masterTotal: () => 0,
  hordeMultiplier: () => 1,
  goalTargets: new Map(),
}

let i18n: I18n

beforeAll(async () => {
  i18n = await createTestI18n("en")
})

beforeEach(() => {
  run.mockReset()
  FARMING.status = "ready"
  createState.items = []
  capture.mockReset()
  run.mockResolvedValue({ ok: true, projectId: "project-1" })
})

function renderWizard(source = SOURCE) {
  const router = createMemoryRouter(
    [
      {
        path: "/legendary-events/:eventId/plan",
        element: <PlanWizard initialTarget={null} source={source} />,
      },
      {
        path: "/legendary-events/:eventId",
        element: <div data-testid="event-page" />,
      },
    ],
    { initialEntries: [`/legendary-events/${utharEvent.id}/plan`] }
  )
  render(<RouterProvider router={router} />, { wrapper: i18nWrapper(i18n) })
  return router
}

const next = () => userEvent.click(screen.getByTestId("plan-wizard-next"))

describe("PlanWizard", () => {
  it("shows the estimated deadline and a verdict per step", async () => {
    renderWizard()
    expect(capture).toHaveBeenCalledWith({
      type: "legendary_event_plan_wizard_opened",
      eventId: utharEvent.id,
      source: "link",
    })
    expect(tourSteps).toMatchObject({ desktop: expect.any(Array) })
    expect(screen.getByTestId("plan-wizard-deadline")).toHaveTextContent(
      "Deadline: about Apr 22, 2027 (estimated)"
    )
    const options = screen.getAllByTestId("plan-wizard-target-option")
    expect(options[0]).toHaveAttribute("data-step", "unlock")
    expect(within(options[0]!).getByRole("radio")).toBeChecked()
    // The exploration runs in chunks; give it room on a busy runner.
    await waitFor(
      () =>
        expect(
          screen.getByTestId("plan-wizard-best-step")
        ).not.toHaveTextContent("Checking"),
      { timeout: 5000 }
    )
  })

  it("shows every lane's roster potential on the Target step", () => {
    renderWizard()
    const potential = screen.getByTestId("plan-wizard-potential")
    expect(within(potential).getByText("Roster potential")).toBeInTheDocument()
    expect(within(potential).getAllByTestId("roster-potential")).toHaveLength(3)
  })

  it("offers to swap a saved team a generated one beats", async () => {
    // No upgrades: on the synced roster only the saved units can score Melee.
    FARMING.status = "unavailable"
    renderWizard({
      ...SOURCE,
      inputs: planInputs({
        plan: {
          ...EMPTY_PLAN,
          teams: [
            {
              id: "mine",
              laneId: "alpha",
              name: "Mine",
              sortOrder: 0,
              memberUnitIds: ["ultraCalgar", "ultraTitus", "ultraApothecary"],
              reserveUnitId: null,
              objectiveIndexes: [0],
              runDepths: [],
            },
          ],
        },
      }),
    })
    await next()
    await next()
    const swap = await screen.findByTestId("plan-wizard-swap")
    expect(swap).toHaveTextContent("These units can score more objectives")
    await userEvent.click(within(swap).getByTestId("plan-wizard-swap-accept"))
    expect(screen.queryByTestId("plan-wizard-swap")).not.toBeInTheDocument()
    expect(screen.getByText("1 team removed")).toBeInTheDocument()
    expect(
      screen
        .getAllByTestId("plan-wizard-team")
        .some((team) => team.dataset.stored === "true")
    ).toBe(false)
  })

  it("walks the five steps and creates the plan in a new project", async () => {
    const router = renderWizard()
    await next()
    expect(
      await screen.findByTestId("plan-wizard-upgrades")
    ).toBeInTheDocument()
    await next()
    expect(screen.getByTestId("plan-wizard-teams")).toBeInTheDocument()
    expect(
      within(
        screen
          .getAllByTestId("plan-wizard-lane")
          .find((lane) => lane.dataset.lane === "alpha")!
      ).getAllByTestId("plan-wizard-team").length
    ).toBeGreaterThan(0)
    await next()
    expect(screen.getByTestId("plan-wizard-runs")).toBeInTheDocument()
    await next()
    expect(screen.getByTestId("plan-wizard-review")).toBeInTheDocument()
    expect(screen.getByTestId("plan-wizard-project-name")).toHaveValue(
      "votanUthar · Unlock"
    )

    // Create waits for the recommendations to be explored.
    await waitFor(() =>
      expect(screen.getByTestId("plan-wizard-create")).toBeEnabled()
    )
    await userEvent.click(screen.getByTestId("plan-wizard-create"))
    expect(run).toHaveBeenCalledTimes(1)
    const call = run.mock.calls[0]![0]
    expect(call.destination).toEqual({
      kind: "new",
      name: "votanUthar · Unlock",
    })
    expect(call.targetEventId).toBe(utharEvent.id)
    expect(call.writes.lanes.length).toBeGreaterThan(0)
    expect(capture).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "legendary_event_plan_created",
        ok: true,
      })
    )
    await waitFor(() =>
      expect(router.state.location.pathname).toBe(
        `/legendary-events/${utharEvent.id}`
      )
    )
  })

  it("asks before leaving once the draft changed", async () => {
    const router = renderWizard()
    const options = screen.getAllByTestId("plan-wizard-target-option")
    await userEvent.click(within(options[1]!).getByRole("radio"))
    void router.navigate(`/legendary-events/${utharEvent.id}`)
    expect(await screen.findByText("Leave the plan?")).toBeInTheDocument()
  })

  it("retries the first attempt's items, not a re-derived draft", async () => {
    renderWizard()
    for (let step = 0; step < 4; step += 1) await next()
    await waitFor(() =>
      expect(screen.getByTestId("plan-wizard-create")).toBeEnabled()
    )
    run.mockImplementationOnce(async () => {
      createState.items = [{ key: "project", status: "failed" }]
      return { ok: false, projectId: null }
    })
    await userEvent.click(screen.getByTestId("plan-wizard-create"))
    expect(screen.getByTestId("plan-wizard-create")).toHaveTextContent(
      "Retry failed"
    )
    expect(screen.getByTestId("plan-wizard-destination")).toBeDisabled()
    await userEvent.click(screen.getByTestId("plan-wizard-create"))
    expect(run).toHaveBeenCalledTimes(2)
    const [first, second] = run.mock.calls.map((call) => call[0])
    expect(second.writes).toBe(first.writes)
    expect(second.destination).toBe(first.destination)
    expect(second.onlyFailed).toBe(true)
  })
})

import userEvent from "@testing-library/user-event"
import type { i18n as I18n } from "i18next"
import { createMemoryRouter, RouterProvider } from "react-router"
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest"

import { utharEvent } from "@/test/fixtures/legendary-events"
import { createTestI18n, i18nWrapper } from "@/test/i18n"
import { render, screen, waitFor, within } from "@/test/render"
import { setViewportWidth } from "@/test/viewport"

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
    starts: [...planInputs().runStarts],
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

afterEach(() => {
  vi.unstubAllGlobals()
})

function renderWizard(source = SOURCE, search = "") {
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
    { initialEntries: [`/legendary-events/${utharEvent.id}/plan${search}`] }
  )
  render(<RouterProvider router={router} />, { wrapper: i18nWrapper(i18n) })
  return router
}

const next = () => userEvent.click(screen.getByTestId("plan-wizard-next"))

const STORED_TEAM = {
  id: "mine",
  laneId: "alpha" as const,
  name: "Mine",
  sortOrder: 0,
  memberUnitIds: ["ultraCalgar", "ultraTitus", "ultraApothecary"],
  reserveUnitId: null,
  objectiveIndexes: [0],
  runDepths: [],
}
const WITH_STORED_TEAM = {
  ...SOURCE,
  inputs: planInputs({ plan: { ...EMPTY_PLAN, teams: [STORED_TEAM] } }),
}

const searchOver = () =>
  waitFor(
    () =>
      expect(screen.getByTestId("plan-wizard-best-step")).not.toHaveTextContent(
        "Checking"
      ),
    { timeout: 5000 }
  )

describe("PlanWizard", () => {
  it("plans to the end of the run in progress and a verdict per step", async () => {
    renderWizard()
    expect(capture).toHaveBeenCalledWith({
      type: "legendary_event_plan_wizard_opened",
      eventId: utharEvent.id,
      source: "link",
    })
    expect(tourSteps).toMatchObject({ desktop: expect.any(Array) })
    expect(screen.getByTestId("plan-wizard-run-inputs")).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: /by the end of run 2\?/ })
    ).toBeInTheDocument()
    expect(screen.getByTestId("plan-wizard-deadline")).toHaveTextContent(
      "Run 2 ends Oct 12, 2026"
    )
    expect(screen.getByTestId("plan-wizard-horizon-2")).toBeChecked()
    const options = screen.getAllByTestId("plan-wizard-target-option")
    expect(options[0]).toHaveAttribute("data-step", "unlock")
    expect(options[0]).toBeChecked()
    // The search shows its progress while it runs, and the bar goes once it ends.
    expect(
      within(screen.getByTestId("plan-wizard-search-progress")).getByRole(
        "progressbar",
        { name: "Upgrade search progress" }
      )
    ).toBeInTheDocument()
    // The exploration runs in chunks; give it room on a busy runner.
    await waitFor(
      () =>
        expect(
          screen.getByTestId("plan-wizard-best-step")
        ).not.toHaveTextContent("Checking"),
      { timeout: 5000 }
    )
    expect(
      screen
        .getAllByTestId("plan-wizard-verdict")
        .map((badge) => badge.textContent)
    ).not.toContain("Checking…")
    expect(
      screen.queryByTestId("plan-wizard-search-progress")
    ).not.toBeInTheDocument()
  })

  it("shows every lane's roster potential under Why this verdict?", async () => {
    renderWizard()
    await userEvent.click(screen.getByTestId("plan-wizard-potential-toggle"))
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
    expect(swap).toHaveTextContent(/Same units, also scoring .+: \+/)
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
    expect(
      screen.queryByTestId("plan-wizard-run-inputs")
    ).not.toBeInTheDocument()
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
    await userEvent.click(options[1]!)
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
  it("keeps the step in the URL, so the browser's Back moves one step without asking", async () => {
    const router = renderWizard()
    await userEvent.click(
      screen.getAllByTestId("plan-wizard-target-option")[1]!
    )
    await next()
    expect(router.state.location.search).toBe("?step=upgrades")
    await next()
    expect(router.state.location.search).toBe("?step=teams")
    await router.navigate(-1)
    expect(
      await screen.findByTestId("plan-wizard-upgrades")
    ).toBeInTheDocument()
    expect(screen.queryByText("Leave the plan?")).not.toBeInTheDocument()
    // Visited steps stay reachable from the chips; later ones do not.
    expect(screen.getByTestId("plan-wizard-chip-teams")).toBeEnabled()
    expect(screen.getByTestId("plan-wizard-chip-runs")).toBeDisabled()
    expect(screen.getByTestId("plan-wizard-chip-review")).toBeDisabled()
    await userEvent.click(screen.getByTestId("plan-wizard-chip-target"))
    expect(screen.getByTestId("plan-wizard-target")).toBeInTheDocument()
  })

  it("opens each new step at the top of the page", async () => {
    const scrollTo = vi.mocked(window.scrollTo)
    scrollTo.mockClear()
    renderWizard()
    expect(scrollTo).not.toHaveBeenCalled()
    await next()
    expect(scrollTo).toHaveBeenCalledWith({ top: 0 })
  })

  it("opens a reload or a deep link to a later step on Target", async () => {
    const router = renderWizard(SOURCE, "?step=teams")
    expect(screen.getByTestId("plan-wizard-target")).toBeInTheDocument()
    await waitFor(() =>
      expect(router.state.location.search).toBe("?step=target")
    )
  })

  it("keeps Back / Next at the bottom of the viewport on desktop", () => {
    renderWizard()
    expect(screen.getByTestId("plan-wizard-footer")).toHaveClass("bottom-0")
  })

  it("shows the mobile layout below 768px: chips, summary strip, footer above the navigation", () => {
    setViewportWidth(390)
    renderWizard()
    expect(screen.getByTestId("plan-wizard-footer")).toHaveClass(
      "bottom-(--mobile-nav-height)"
    )
    expect(screen.getByTestId("plan-wizard-chip-target")).toBeEnabled()
    expect(screen.getByTestId("plan-wizard-chip-upgrades")).toBeDisabled()
    expect(screen.getByTestId("plan-wizard-summary")).toHaveClass("sticky")
  })

  it("puts every tour target on the Target step at both widths", () => {
    for (const width of [1280, 390]) {
      setViewportWidth(width)
      const { unmount } = render(
        <RouterProvider
          router={createMemoryRouter(
            [
              {
                path: "/plan",
                element: <PlanWizard initialTarget={null} source={SOURCE} />,
              },
            ],
            { initialEntries: ["/plan"] }
          )}
        />,
        { wrapper: i18nWrapper(i18n) }
      )
      const steps = (
        tourSteps as Record<"desktop" | "mobile", { target: string }[]>
      )[width < 768 ? "mobile" : "desktop"]
      for (const step of steps) {
        expect(document.querySelector(step.target)).not.toBeNull()
      }
      // The whole card list is taller than a phone screen, so mobile points at one card.
      expect(
        document.querySelector(steps[2]!.target)?.getAttribute("data-testid")
      ).toBe(
        width < 768 ? "plan-wizard-target-option" : "plan-wizard-target-cards"
      )
      unmount()
    }
  })

  it("moves the choice with the arrow keys", async () => {
    renderWizard()
    const options = screen.getAllByTestId("plan-wizard-target-option")
    options[0]!.focus()
    await userEvent.keyboard("{ArrowDown}")
    expect(options[1]).toBeChecked()
    expect(options[1]).toHaveFocus()
    expect(capture).toHaveBeenCalledWith(
      expect.objectContaining({ type: "legendary_event_plan_target_chosen" })
    )
  })

  it("moves the run with the arrow keys, one tab stop for the picker", async () => {
    renderWizard()
    const run2 = screen.getByTestId("plan-wizard-horizon-2")
    const run3 = screen.getByTestId("plan-wizard-horizon-3")
    expect(run2).toHaveAttribute("tabindex", "0")
    expect(run3).toHaveAttribute("tabindex", "-1")
    run2.focus()
    await userEvent.keyboard("{ArrowRight}")
    expect(run3).toBeChecked()
    expect(run3).toHaveFocus()
    expect(run3).toHaveAttribute("tabindex", "0")
    await userEvent.keyboard("{ArrowRight}")
    expect(run2).toBeChecked()
  })

  it("summarises the run inputs in the closed Assumptions panel", async () => {
    renderWizard()
    const of = utharEvent.regularMissions.length
    expect(
      screen.getByTestId("plan-wizard-run-inputs-summary")
    ).toHaveTextContent(`Run 2: 0 of ${of} missions`)
    await userEvent.click(screen.getByTestId("plan-wizard-horizon-3"))
    expect(
      screen.getByTestId("plan-wizard-run-inputs-summary")
    ).toHaveTextContent(
      `Run 2: 0 of ${of} missions · Run 3: 0 of ${of} missions`
    )
    expect(screen.queryByTestId("run-inputs-run")).not.toBeInTheDocument()
    await userEvent.click(screen.getByTestId("plan-wizard-run-inputs-toggle"))
    expect(screen.getAllByTestId("run-inputs-run").length).toBeGreaterThan(0)
  })

  it("selects the highest step within reach once the search ends, unless the user chose", async () => {
    renderWizard()
    await searchOver()
    const checked = screen
      .getAllByTestId("plan-wizard-target-option")
      .find((option) => option.getAttribute("aria-checked") === "true")!
    const best = screen.getByTestId("plan-wizard-best-step").textContent ?? ""
    if (best.includes("is the highest step within reach")) {
      expect(best).toContain(
        within(checked).getAllByText(/\S/)[0]!.textContent ?? ""
      )
    } else {
      expect(checked).toHaveAttribute("data-step", "unlock")
    }
  })

  it("never replaces an explicit choice", async () => {
    renderWizard()
    const options = screen.getAllByTestId("plan-wizard-target-option")
    const chosen = options.at(-1)!
    await userEvent.click(chosen)
    await searchOver()
    expect(
      screen
        .getAllByTestId("plan-wizard-target-option")
        .find((option) => option.getAttribute("aria-checked") === "true")
    ).toHaveAttribute("data-step", chosen.dataset.step)
    expect(screen.getByTestId("plan-wizard-summary-moved")).toHaveTextContent(
      ""
    )
  })

  it("undoes one removed team at a time", async () => {
    FARMING.status = "unavailable"
    renderWizard()
    await next()
    await next()
    const alpha = () =>
      screen
        .getAllByTestId("plan-wizard-lane")
        .find((lane) => lane.dataset.lane === "alpha")!
    const teams = within(alpha()).getAllByTestId("plan-wizard-team")
    expect(teams.length).toBeGreaterThanOrEqual(2)
    await userEvent.click(
      within(teams[0]!).getByTestId("plan-wizard-team-remove")
    )
    await userEvent.click(
      within(
        within(alpha()).getAllByTestId("plan-wizard-team")[0]!
      ).getByTestId("plan-wizard-team-remove")
    )
    const removed = within(alpha()).getAllByTestId("plan-wizard-removed-team")
    expect(removed).toHaveLength(2)
    const [first, second] = removed.map((row) => row.textContent)
    await userEvent.click(
      within(removed[0]!).getByTestId("plan-wizard-team-undo")
    )
    const left = within(alpha()).getAllByTestId("plan-wizard-removed-team")
    expect(left).toHaveLength(1)
    expect(left[0]!.textContent).toBe(second)
    expect(left[0]!.textContent).not.toBe(first)
    await userEvent.click(screen.getByTestId("plan-wizard-teams-restore-all"))
    expect(
      within(alpha()).queryAllByTestId("plan-wizard-removed-team")
    ).toHaveLength(0)
  })

  it("opens Edit on the team's objectives, its depth estimate and the Power sort", async () => {
    FARMING.status = "unavailable"
    renderWizard(WITH_STORED_TEAM)
    await next()
    await next()
    const stored = screen
      .getAllByTestId("plan-wizard-team")
      .find((team) => team.dataset.stored === "true")!
    await userEvent.click(within(stored).getByTestId("plan-wizard-team-edit"))
    await screen.findByTestId("team-editor-name")
    const chips = screen.getAllByTestId("team-picker-objective-chip")
    expect(
      chips.map((chip) => chip.getAttribute("aria-pressed") === "true")
    ).toEqual(chips.map((_, index) => index === 0))
    expect(screen.getByTestId("team-picker-sort-power")).toBeEnabled()
    expect(screen.getByTestId("team-picker-sort-power")).toHaveAttribute(
      "data-state",
      "on"
    )
    expect(
      screen.getByTestId("team-editor-summary-depth")
    ).not.toHaveTextContent("not set")
  })

  it("sends an edited stored team's name with its update", async () => {
    FARMING.status = "unavailable"
    renderWizard(WITH_STORED_TEAM)
    await next()
    await next()
    const stored = screen
      .getAllByTestId("plan-wizard-team")
      .find((team) => team.dataset.stored === "true")!
    await userEvent.click(within(stored).getByTestId("plan-wizard-team-edit"))
    const name = await screen.findByTestId("team-editor-name")
    await userEvent.clear(name)
    await userEvent.type(name, "Renamed")
    await userEvent.click(screen.getByTestId("team-editor-save"))
    await next()
    await next()
    await waitFor(() =>
      expect(screen.getByTestId("plan-wizard-create")).toBeEnabled()
    )
    await userEvent.click(screen.getByTestId("plan-wizard-create"))
    const call = run.mock.calls[0]![0]
    const update = call.writes.lanes.flatMap(
      (lane: { update: { storedId: string | null }[] }) => lane.update
    )
    expect(
      update.map((team: { storedId: string | null }) => team.storedId)
    ).toEqual(["mine"])
    expect(call.teamName(update[0])).toBe("Renamed")
  })

  it("names every removed team on Review in destructive styling", async () => {
    FARMING.status = "unavailable"
    renderWizard(WITH_STORED_TEAM)
    await next()
    await next()
    expect(screen.getByTestId("plan-wizard-teams-keep")).toHaveTextContent(
      "Keep my team (1)"
    )
    await userEvent.click(screen.getByTestId("plan-wizard-teams-replace"))
    await next()
    await next()
    const removal = screen.getByTestId("plan-wizard-review-remove")
    expect(removal).toHaveTextContent("Remove 'Mine' from Alpha")
    expect(removal).toHaveClass("text-destructive")
    const created = screen.getAllByTestId("plan-wizard-review-create").length
    expect(screen.getByTestId("plan-wizard-create")).toHaveTextContent(
      created === 1 ? "Create 1 team" : `Create ${created} teams`
    )
    expect(
      within(screen.getByTestId("plan-wizard-review-runs")).getByText(
        "Nothing to change"
      )
    ).toBeInTheDocument()
  })

  it("names a removed lane-default team on Review as the Teams step shows it", async () => {
    FARMING.status = "unavailable"
    renderWizard({
      ...SOURCE,
      inputs: planInputs({
        plan: { ...EMPTY_PLAN, teams: [{ ...STORED_TEAM, name: "alpha" }] },
      }),
    })
    await next()
    await next()
    // The stored team is listed first in its lane.
    const alpha = screen
      .getAllByTestId("plan-wizard-lane")
      .find((lane) => lane.dataset.lane === "alpha")!
    await userEvent.click(
      within(within(alpha).getAllByTestId("plan-wizard-team")[0]!).getByTestId(
        "plan-wizard-team-remove"
      )
    )
    const shown = screen.getByTestId("plan-wizard-removed-team").textContent
    const name = shown?.replace("Undo", "").trim()
    expect(name).toBeTruthy()
    expect(name).not.toBe("alpha")
    await next()
    await next()
    expect(screen.getByTestId("plan-wizard-review-remove")).toHaveTextContent(
      `Remove '${name}' from Alpha`
    )
    // Replacing removes it without a manual removal: the same name.
    await userEvent.click(screen.getByTestId("plan-wizard-step-teams"))
    await userEvent.click(screen.getByTestId("plan-wizard-team-undo"))
    await userEvent.click(screen.getByTestId("plan-wizard-teams-replace"))
    await userEvent.click(screen.getByTestId("plan-wizard-step-review"))
    expect(screen.getByTestId("plan-wizard-review-remove")).toHaveTextContent(
      `Remove '${name}' from Alpha`
    )
  })

  it("offers Retry failed at once after a partial failure and asks before leaving", async () => {
    const router = renderWizard()
    for (let step = 0; step < 4; step += 1) await next()
    await waitFor(() =>
      expect(screen.getByTestId("plan-wizard-create")).toBeEnabled()
    )
    run.mockImplementationOnce(async () => {
      createState.items = [{ key: "goals:calgar", status: "failed" }]
      return { ok: false, projectId: null }
    })
    await userEvent.click(screen.getByTestId("plan-wizard-create"))
    expect(screen.getByTestId("plan-wizard-create")).toHaveTextContent(
      "Retry failed"
    )
    expect(screen.getByTestId("plan-wizard-create")).toBeEnabled()
    void router.navigate(`/legendary-events/${utharEvent.id}`)
    expect(
      await screen.findByText("Some items failed. Leave without retrying?")
    ).toBeInTheDocument()
  })
  it("groups upgrades by run and sets the ticks with All, None and Just enough", async () => {
    renderWizard()
    // Upgrades cannot help the run in progress: plan to run 3.
    await userEvent.click(screen.getByTestId("plan-wizard-horizon-3"))
    await searchOver()
    await next()
    const boxes = () => screen.getAllByRole("checkbox")
    expect(
      screen.getAllByTestId("plan-wizard-upgrade-group")[0]
    ).toHaveTextContent(/Ready for run \d/)
    await userEvent.click(screen.getByRole("button", { name: "All" }))
    expect(
      boxes().every((box) => box.getAttribute("aria-checked") === "true")
    ).toBe(true)
    await userEvent.click(screen.getByRole("button", { name: "None" }))
    expect(
      boxes().some((box) => box.getAttribute("aria-checked") === "true")
    ).toBe(false)
    await userEvent.click(screen.getByRole("button", { name: "Just enough" }))
    expect(
      screen.queryByTestId("plan-wizard-upgrades-new")
    ).not.toBeInTheDocument()
  })

  it("makes the mobile lane tabs accessible tabs", async () => {
    setViewportWidth(390)
    FARMING.status = "unavailable"
    renderWizard()
    await next()
    await next()
    const tabs = screen.getAllByRole("tab")
    expect(tabs[0]).toHaveAttribute("aria-selected", "true")
    expect(tabs[0]).toHaveAttribute("aria-controls", "plan-wizard-lane-alpha")
    expect(document.getElementById("plan-wizard-lane-alpha")).toHaveAttribute(
      "role",
      "tabpanel"
    )
    tabs[0]!.focus()
    await userEvent.keyboard("{ArrowRight}")
    expect(screen.getAllByRole("tab")[1]).toHaveAttribute(
      "aria-selected",
      "true"
    )
  })

  it("plans to a later run with its guessed end", async () => {
    renderWizard()
    const run3 = screen.getByTestId("plan-wizard-horizon-3")
    expect(run3).toHaveTextContent("maybe ~Feb 2027")
    await userEvent.click(run3)
    expect(run3).toBeChecked()
    expect(
      screen.getByRole("heading", { name: /by the end of run 3\?/ })
    ).toBeInTheDocument()
    expect(screen.getByTestId("plan-wizard-deadline")).toHaveTextContent(
      "Run 3 ends maybe around Feb 28, 2027 (guessed from past runs)"
    )
  })
})

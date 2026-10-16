import { useEffect, useState } from "react"
import { MemoryRouter, Route, Routes, useLocation } from "react-router"
import type { i18n as I18n } from "i18next"
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest"

import { fixtureCharacter } from "@/test/fixtures/legendary-event-characters"
import {
  farsightEvent,
  lysanderEvent,
  utharEvent,
} from "@/test/fixtures/legendary-events"
import { createTestI18n, i18nWrapper } from "@/test/i18n"
import { fireEvent, render, screen, waitFor, within } from "@/test/render"
import { setViewportWidth } from "@/test/viewport"

import { MasterTablePage } from "./master-table-page"

vi.mock("dexie-react-hooks", () => ({
  useLiveQuery: <T,>(querier: () => Promise<T>, deps: unknown[]) => {
    const [value, setValue] = useState<T>()
    useEffect(() => {
      void querier().then(setValue)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps)
    return value
  },
}))

const UNIT_IDS = [
  "bloodDante",
  "ultraCalgar",
  "bloodMephiston",
  "tauFarsight",
] as const
const characters = UNIT_IDS.map((id) => fixtureCharacter(id))
const dante = {
  ...lysanderEvent,
  id: "bloodDante",
  finished: true,
  eventStageStartDatesUtc: ["2026-01-04T00:00:00Z"],
}

const data = vi.hoisted(() => ({
  events: [] as unknown[],
  eventsFail: false,
  eventsPending: false,
  roster: undefined as unknown[] | undefined,
  rosterFail: false,
  progress: [] as unknown[],
  progressFail: false,
  battlesFail: false,
  plans: { status: "ready", data: [] as unknown[] } as {
    status: "loading" | "error" | "ready"
    data?: unknown[]
  },
  capture: vi.fn(),
  steps: undefined as unknown,
}))
const read = <T,>(value: T, fail = false): Promise<T> =>
  fail ? Promise.reject(new Error("read")) : Promise.resolve(value)

vi.mock("@workspace/game-catalog/queries", () => ({
  getLegendaryEvents: () =>
    data.eventsPending
      ? new Promise(() => {})
      : read(data.events, data.eventsFail),
  getCharacters: async () => characters,
  getCharactersMap: async () =>
    new Map(characters.map((unit) => [unit.id, unit])),
  getMowsMap: async () => new Map(),
  getLegendaryEventBattles: (eventId: string) =>
    read(
      [utharEvent, lysanderEvent, farsightEvent, dante]
        .filter((event) => event.id === eventId)
        .flatMap((event) =>
          (["alpha", "beta", "gamma"] as const).flatMap((lane) =>
            event[lane].battleIds.map((id) => ({ id, power: 1e15 }))
          )
        ),
      data.battlesFail
    ),
  getHordeModeTiers: async () => null,
}))
vi.mock("@workspace/player-data/queries", () => ({
  getPlayerCharacters: () => read(data.roster, data.rosterFail),
  getLegendaryEventsProgress: () => read(data.progress, data.progressFail),
}))
vi.mock("@/entities/legendary-event", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/legendary-event")>()),
  useLegendaryEventPlans: () => ({ ...data.plans, retry: vi.fn() }),
}))
vi.mock("@/shared/analytics", () => ({
  useAnalyticsActions: () => ({ captureEvent: data.capture }),
}))
vi.mock("@/shared/tour", () => ({
  useTourPageSteps: (steps: unknown) => {
    data.steps = steps
  },
}))

let i18n: I18n

function LocationProbe() {
  const location = useLocation()
  return <span data-testid="location">{location.search}</span>
}

function renderPage(search = "") {
  return render(
    <MemoryRouter initialEntries={[`/legendary-events/master-table${search}`]}>
      <LocationProbe />
      <Routes>
        <Route
          element={<MasterTablePage />}
          path="/legendary-events/master-table"
        />
      </Routes>
    </MemoryRouter>,
    { wrapper: i18nWrapper(i18n) }
  )
}

const ready = () => screen.findByTestId("master-table-page")
const rowIds = () =>
  [
    screen.queryByTestId("master-table-first-row"),
    ...screen.queryAllByTestId("master-table-row"),
  ]
    .filter((row): row is HTMLElement => row !== null)
    .map((row) => row.dataset.unit)
const rowOf = (unitId: string) =>
  [
    screen.getByTestId("master-table-first-row"),
    ...screen.queryAllByTestId("master-table-row"),
  ].find((row) => row.dataset.unit === unitId)!
const search = () =>
  new URLSearchParams(screen.getByTestId("location").textContent ?? "")
const fullyCleared = (battles: number) =>
  Array.from({ length: battles }, () => ({
    objectivesCleared: [0, 1, 2, 3, 4, 5],
    highScore: 0,
    encounterPoints: 0,
  }))

describe("MasterTablePage", () => {
  beforeAll(async () => {
    i18n = await createTestI18n("en")
  })
  beforeEach(() => {
    Object.assign(data, {
      events: [utharEvent, farsightEvent, lysanderEvent, dante],
      eventsFail: false,
      eventsPending: false,
      roster: [
        {
          unitId: "bloodDante",
          rank: "Gold1",
          progressionIndex: "Legendary:RedThreeStars",
        },
      ],
      rosterFail: false,
      progress: [],
      progressFail: false,
      battlesFail: false,
      plans: { status: "ready", data: [] },
      steps: undefined,
    })
    data.capture.mockClear()
    setViewportWidth(1280)
    // Uthar active (from 2026-10-04), Farsight upcoming, Lysander upcoming (TBA), Dante archived.
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(new Date("2026-10-06T12:00:00Z"))
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it("selects every active and upcoming event by default and lists archived ones below the divider", async () => {
    renderPage()
    await ready()
    fireEvent.click(screen.getByTestId("master-table-events"))
    const options = await screen.findAllByTestId("master-table-event-option")
    expect(options.map((option) => option.dataset.event)).toEqual([
      "votanUthar",
      "tauFarsight",
      "astarLysander",
      "bloodDante",
    ])
    const checked = options.map((option) =>
      within(option).getByRole("checkbox").getAttribute("aria-checked")
    )
    expect(checked).toEqual(["true", "true", "true", "false"])
    expect(
      screen.getByTestId("master-table-archived-divider")
    ).toHaveTextContent("Archived")
    expect(data.capture).toHaveBeenCalledWith({
      type: "legendary_event_master_table_viewed",
      eventCount: 3,
      unitSet: "all",
      pointsMode: "remaining",
    })
    expect(data.capture).toHaveBeenCalledTimes(1)
  })

  it("reproduces Dante across Lysander and Uthar in All mode: 11,142", async () => {
    renderPage("?events=astarLysander,votanUthar&points=all&units=all")
    await ready()
    const dante = await waitFor(() => rowOf("bloodDante"))
    expect(within(dante).getByTestId("master-table-total")).toHaveTextContent(
      "11,142"
    )
    const cells = within(dante).getAllByTestId("master-table-cell-points")
    expect(cells.map((cell) => [cell.dataset.event, cell.textContent])).toEqual(
      [
        ["votanUthar", "4,608"],
        ["astarLysander", "6,534"],
      ]
    )
  })

  it("deducts synced progress in Remaining: 10,382", async () => {
    data.progress = [
      {
        id: "astarLysander",
        currentEventRun: 1,
        alpha: { encounters: fullyCleared(5) },
        beta: null,
        gamma: null,
      },
    ]
    renderPage("?events=astarLysander,votanUthar")
    await ready()
    await waitFor(() =>
      expect(
        within(rowOf("bloodDante")).getByTestId("master-table-total")
      ).toHaveTextContent("10,382")
    )
  })

  it("restores a shared link and sorts by Farsight", async () => {
    data.roster = [
      {
        unitId: "bloodDante",
        rank: "Gold1",
        progressionIndex: "Legendary:RedThreeStars",
      },
      {
        unitId: "tauFarsight",
        rank: "Gold1",
        progressionIndex: "Legendary:RedThreeStars",
      },
    ]
    renderPage(
      "?events=tauFarsight,votanUthar&units=unlocked&points=all&sort=tauFarsight"
    )
    await ready()
    expect(
      screen.getByTestId("master-table-unit-set-unlocked")
    ).toHaveAttribute("data-state", "on")
    expect(screen.getByTestId("master-table-points-all")).toHaveAttribute(
      "data-state",
      "on"
    )
    await waitFor(() => expect(rowIds()).toEqual(["tauFarsight", "bloodDante"]))
    expect(
      screen.getByTestId("master-table-sort-tauFarsight").closest("th")
    ).toHaveAttribute("aria-sort", "descending")
  })

  it("sorts by an event header, puts it in the URL, and Total restores the default", async () => {
    renderPage("?events=astarLysander,votanUthar&points=all")
    await ready()
    await waitFor(() => rowOf("bloodDante"))
    fireEvent.click(screen.getByTestId("master-table-sort-votanUthar"))
    expect(search().get("sort")).toBe("votanUthar")
    expect(data.capture).toHaveBeenCalledWith({
      type: "legendary_event_master_table_changed",
      control: "sort",
      value: "votanUthar",
      eventCount: null,
    })
    fireEvent.click(screen.getByTestId("master-table-sort-total"))
    expect(search().get("sort")).toBeNull()
  })

  it("asks to pick an event when none is selected", async () => {
    renderPage("?events=votanUthar")
    await ready()
    fireEvent.click(screen.getByTestId("master-table-events"))
    const [uthar] = await screen.findAllByTestId("master-table-event-option")
    fireEvent.click(within(uthar!).getByRole("checkbox"))
    expect(
      await screen.findByTestId("master-table-no-events")
    ).toHaveTextContent("Pick at least one event")
    expect(search().get("events")).toBe("")
    expect(data.capture).toHaveBeenCalledWith({
      type: "legendary_event_master_table_changed",
      control: "events",
      value: null,
      eventCount: 0,
    })
  })

  it("shows No unit matches with Clear search", async () => {
    renderPage("?q=zzz")
    await ready()
    expect(await screen.findByTestId("master-table-no-rows")).toHaveTextContent(
      "No unit matches"
    )
    fireEvent.click(screen.getByRole("button", { name: "Clear search" }))
    await waitFor(() =>
      expect(screen.queryByTestId("master-table-no-rows")).toBeNull()
    )
  })

  it("filters by name", async () => {
    renderPage("?q=dan")
    await ready()
    await waitFor(() => expect(rowIds()).toEqual(["bloodDante"]))
  })

  it("defaults to In teams when a selected plan has a team, counting team coverage", async () => {
    data.plans = {
      status: "ready",
      data: [
        {
          eventId: "astarLysander",
          revision: 1,
          catalogVersion: "1",
          notes: null,
          showPaidOptions: false,
          teams: [
            {
              id: "assault",
              laneId: "gamma",
              name: "Assault",
              sortOrder: 0,
              memberUnitIds: ["bloodDante"],
              reserveUnitId: null,
              objectiveIndexes: [2, 4],
              runDepths: [],
            },
          ],
        },
      ],
    }
    renderPage("?events=astarLysander&points=all")
    await ready()
    expect(screen.getByTestId("master-table-unit-set-inTeams")).toHaveAttribute(
      "data-state",
      "on"
    )
    await waitFor(() => expect(rowIds()).toEqual(["bloodDante"]))
    const [points, detail] = [
      within(rowOf("bloodDante")).getByTestId("master-table-cell-points"),
      within(rowOf("bloodDante")).getByTestId("master-table-cell-detail"),
    ]
    expect(points).toHaveTextContent("3,078")
    expect(detail).toHaveTextContent("1")
    expect(detail).toHaveTextContent("Gamma")
  })

  it("disables In teams with Teams unavailable when the plan list fails", async () => {
    data.plans = { status: "error" }
    renderPage("?units=inTeams")
    await ready()
    expect(screen.getByTestId("master-table-unit-set-inTeams")).toBeDisabled()
    expect(screen.getByTestId("master-table-unit-set-hint")).toHaveTextContent(
      "Teams unavailable"
    )
    expect(screen.getByTestId("master-table-unit-set-all")).toHaveAttribute(
      "data-state",
      "on"
    )
  })

  it("disables Unlocked and Estimated without a roster", async () => {
    data.rosterFail = true
    renderPage()
    await ready()
    await waitFor(() =>
      expect(
        screen.getByTestId("master-table-unit-set-unlocked")
      ).toBeDisabled()
    )
    expect(screen.getByTestId("master-table-unit-set-hint")).toHaveTextContent(
      "Sync your roster"
    )
    expect(screen.getByTestId("master-table-points-estimated")).toBeDisabled()
  })

  it("labels Remaining when synced progress failed", async () => {
    data.progressFail = true
    renderPage("?events=astarLysander,votanUthar")
    await ready()
    expect(await screen.findByTestId("master-table-no-progress")).toBeVisible()
    await waitFor(() =>
      expect(
        within(rowOf("bloodDante")).getByTestId("master-table-total")
      ).toHaveTextContent("11,142")
    )
  })

  it("shows Remaining with a note when a link asks for Estimated without estimates", async () => {
    data.battlesFail = true
    renderPage("?points=estimated")
    await ready()
    expect(
      await screen.findByTestId("master-table-estimated-fallback")
    ).toHaveTextContent("Estimated needs clear estimates")
    expect(screen.getByTestId("master-table-points-remaining")).toHaveAttribute(
      "data-state",
      "on"
    )
    expect(screen.getByTestId("master-table-points-hint")).toHaveTextContent(
      "Needs clear estimates"
    )
  })

  it("records a points mode change", async () => {
    renderPage()
    await ready()
    fireEvent.click(screen.getByTestId("master-table-points-all"))
    expect(search().get("points")).toBe("all")
    expect(data.capture).toHaveBeenCalledWith({
      type: "legendary_event_master_table_changed",
      control: "pointsMode",
      value: "all",
      eventCount: null,
    })
  })

  it("shows skeleton rows while the catalog loads, and an error with Retry when it fails", async () => {
    data.eventsPending = true
    const { unmount } = renderPage()
    expect(screen.getByTestId("master-table-loading")).toBeVisible()
    unmount()
    data.eventsPending = false
    data.eventsFail = true
    renderPage()
    expect(await screen.findByTestId("master-table-error")).toHaveTextContent(
      "Retry"
    )
  })

  it("renders cards with one line per event and a Controls sheet with Sort by on mobile", async () => {
    setViewportWidth(390)
    renderPage("?events=astarLysander,votanUthar&points=all")
    await ready()
    expect(screen.queryByTestId("master-table")).toBeNull()
    const card = await waitFor(() => rowOf("bloodDante"))
    expect(
      within(card)
        .getAllByTestId("master-table-event-line")
        .map((line) => line.textContent)
    ).toEqual([
      "Uthar · 4,608 · 3 objectives",
      "Lysander · 6,534 · 5 objectives",
    ])
    fireEvent.click(screen.getByTestId("master-table-controls"))
    const sheet = await screen.findByTestId("master-table-controls-sheet")
    expect(within(sheet).getByTestId("master-table-events")).toBeVisible()
    expect(within(sheet).getByTestId("master-table-points-mode")).toBeVisible()
    expect(within(sheet).getByTestId("master-table-sort")).toBeVisible()
  })

  it("registers the same four tour steps on both forms", async () => {
    renderPage()
    await ready()
    const steps = data.steps as {
      desktop: { target: string }[]
      mobile: { target: string; before?: unknown }[]
    }
    const targets = [
      '[data-testid="master-table-controls"]',
      '[data-testid="master-table-events"]',
      '[data-testid="master-table-points-mode"]',
      '[data-testid="master-table-first-row"]',
    ]
    expect(steps.desktop.map((step) => step.target)).toEqual(targets)
    expect(steps.mobile.map((step) => step.target)).toEqual(targets)
    expect(steps.mobile[1]?.before).toBeTypeOf("function")
    expect(steps.mobile[3]?.before).toBeTypeOf("function")
  })
})

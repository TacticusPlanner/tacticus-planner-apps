import { MemoryRouter, Outlet, Route, Routes } from "react-router"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { render, screen } from "@/test/render"
import { ready } from "@/test/fixtures/daily-raids"

import {
  countActiveFilterGroups,
  useRaidsFilters,
} from "@/features/daily-raids"
import type { DailiesOutletContext } from "./dailies-layout"
import { TodayPage } from "./today-page"

const { useIsMobileMock, state, activeEventSpy, dailyRaidsArgs } = vi.hoisted(
  () => ({
    useIsMobileMock: vi.fn(() => false),
    state: { pinned: false },
    // An event is running, yet Today must neither read the calendar nor score by it.
    activeEventSpy: vi.fn(() => ({
      status: "ready",
      active: {
        definitionId: "hse-machine-hunt",
        startUtc: "2026-10-02T08:00:00Z",
        endUtc: "2026-10-06T08:00:00Z",
      },
      next: null,
      nowMs: 0,
    })),
    dailyRaidsArgs: [] as unknown[][],
  })
)

vi.mock("react-i18next", () => ({
  initReactI18next: { type: "3rdParty", init: vi.fn() },
  useTranslation: () => ({
    t: (key: string, values?: Record<string, unknown>) =>
      values && "count" in values ? `${key}:${values.count}` : key,
  }),
}))
// A stand-in for the real hook that reacts to the applied filter the way calculateDailyRaids does:
// a slots filter removes every Today node and reports the material (or pinned goal) as filtered out.
vi.mock("@/features/daily-raids", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/daily-raids")>()
  return {
    ...actual,
    useDailyRaids: (...args: unknown[]) => {
      dailyRaidsArgs.push(args)
      const [filters] = useRaidsFilters()
      const base = ready()
      return countActiveFilterGroups(filters) === 0
        ? base
        : {
            ...base,
            today: {
              ...base.today,
              entries: [],
              energyTotal: 0,
              raidsTotal: 0,
            },
            bonus: { ...base.bonus, entries: [] },
            filteredOut: [
              {
                goalId: "g1",
                resourceId: "U1" as never,
                remaining: 3,
                pinned: state.pinned,
              },
            ],
          }
    },
  }
})
vi.mock("@/features/daily-raids/model/use-active-home-screen-event", () => ({
  useActiveHomeScreenEvent: activeEventSpy,
}))
vi.mock("./campaign-event-status", () => ({
  CampaignEventStatusLine: () => null,
}))
vi.mock("@/shared/tour", () => ({ useTourPageSteps: vi.fn() }))
vi.mock("@workspace/ui/hooks/use-mobile", () => ({
  useIsMobile: () => useIsMobileMock(),
}))
vi.mock("@workspace/game-catalog/queries", () => ({
  getCampaignBattles: () => [
    {
      enemiesTotal: 5,
      enemiesTypes: [],
      detailedEnemyTypes: [{ id: "bot", count: 1 }],
    },
  ],
  getCharactersMap: () => new Map(),
  getNpcsMap: () => new Map([["bot", { traits: ["Mechanical"] }]]),
}))
vi.mock("dexie-react-hooks", () => ({
  useLiveQuery: (querier: () => unknown) => querier(),
}))

function renderToday() {
  const context: DailiesOutletContext = {
    projects: [],
    projectId: undefined,
    setProjectId: vi.fn(),
    projectsUnavailable: false,
    projectsError: false,
    retryProjects: vi.fn(),
  }
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<Outlet context={context} />}>
          <Route index element={<TodayPage />} />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}

async function applySlotsFilter(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByTestId("raids-filters"))
  await user.click(await screen.findByTestId("raids-filters-slots"))
  await user.click(screen.getByTestId("option-5"))
  await user.keyboard("{Escape}")
  await user.click(screen.getByTestId("raids-filters-apply"))
}

describe("Today page Raids Filters", () => {
  beforeEach(() => {
    state.pinned = false
    activeEventSpy.mockClear()
    dailyRaidsArgs.length = 0
    useIsMobileMock.mockReturnValue(false)
  })

  it("is not event-optimised: no event read, no event scoring, no event UI while an event is active", () => {
    renderToday()

    expect(activeEventSpy).not.toHaveBeenCalled()
    // Only the project id is passed; the HSE tab alone passes `homeScreenEventId`.
    expect(dailyRaidsArgs.every(([, options]) => options === undefined)).toBe(
      true
    )
    expect(document.querySelector('[data-testid^="hse-"]')).toBeNull()
  })

  it("shows the trigger with a label on desktop", () => {
    renderToday()
    expect(screen.getByTestId("raids-filters")).toHaveTextContent(
      "raidsFilters.trigger"
    )
  })

  it("shows an icon-only, named trigger on mobile", () => {
    useIsMobileMock.mockReturnValue(true)
    renderToday()
    const trigger = screen.getByTestId("raids-filters")
    expect(trigger).toHaveAccessibleName("raidsFilters.trigger")
    expect(trigger).not.toHaveTextContent("raidsFilters.trigger")
  })

  it("changes the rendered raids and offers a Reset when a filter filters everything out", async () => {
    const user = userEvent.setup()
    renderToday()
    expect(screen.getByTestId("today-raid-list")).toBeInTheDocument()
    expect(
      screen.queryByTestId("raids-filters-filtered-out")
    ).not.toBeInTheDocument()

    await applySlotsFilter(user)

    expect(screen.queryByTestId("today-raid-list")).not.toBeInTheDocument()
    expect(screen.getByTestId("raids-filters-badge")).toHaveTextContent("1")
    expect(
      screen.getByTestId("raids-filters-filtered-out-materials")
    ).toHaveTextContent("raidsFilters.filteredOut.materials:1")
    expect(
      screen.queryByTestId("raids-filters-filtered-out-pinned")
    ).not.toBeInTheDocument()

    await user.click(screen.getByTestId("raids-filters-filtered-out-reset"))

    expect(screen.getByTestId("today-raid-list")).toBeInTheDocument()
    expect(
      screen.queryByTestId("raids-filters-filtered-out")
    ).not.toBeInTheDocument()
    expect(screen.queryByTestId("raids-filters-badge")).not.toBeInTheDocument()
  })

  it("applies an Enemy traits filter from the dialog: badge, filtered-out notice, Reset", async () => {
    const user = userEvent.setup()
    renderToday()

    await user.click(screen.getByTestId("raids-filters"))
    await user.click(await screen.findByTestId("raids-filters-enemy-traits"))
    await user.click(screen.getByTestId("option-Mechanical"))
    await user.keyboard("{Escape}")
    await user.click(screen.getByTestId("raids-filters-apply"))

    expect(screen.getByTestId("raids-filters-badge")).toHaveTextContent("1")
    expect(
      screen.getByTestId("raids-filters-filtered-out-materials")
    ).toBeInTheDocument()

    await user.click(screen.getByTestId("raids-filters-filtered-out-reset"))
    expect(screen.queryByTestId("raids-filters-badge")).not.toBeInTheDocument()
  })

  it("words a goal pinned to an excluded location separately", async () => {
    state.pinned = true
    const user = userEvent.setup()
    renderToday()

    await applySlotsFilter(user)

    expect(
      screen.getByTestId("raids-filters-filtered-out-pinned")
    ).toHaveTextContent("raidsFilters.filteredOut.pinned:1")
    expect(
      screen.queryByTestId("raids-filters-filtered-out-materials")
    ).not.toBeInTheDocument()
  })
})

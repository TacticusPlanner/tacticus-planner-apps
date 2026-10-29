import { MemoryRouter, Outlet, Route, Routes, useLocation } from "react-router"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { render, screen } from "@/test/render"
import { ready } from "@/test/fixtures/daily-raids"

import type { DailiesOutletContext } from "./dailies-layout"
import { TodayPage } from "./today-page"

const { dailyRaidsArgs } = vi.hoisted(() => ({
  dailyRaidsArgs: [] as unknown[][],
}))

vi.mock("@/features/daily-raids", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/daily-raids")>()
  return {
    ...actual,
    useDailyRaids: (...args: unknown[]) => {
      dailyRaidsArgs.push(args)
      return ready()
    },
  }
})
vi.mock("./campaign-event-status", () => ({
  CampaignEventTile: () => null,
}))
vi.mock("./today-shops", () => ({ TodayShops: () => null }))
vi.mock("@/shared/tour", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/tour")>()),
  useTourPageSteps: vi.fn(),
}))

function Search() {
  return <span data-testid="search">{useLocation().search}</span>
}

function renderToday(entry = "/") {
  const context: DailiesOutletContext = {
    projects: [],
    projectId: undefined,
    setProjectId: vi.fn(),
    projectsUnavailable: false,
    projectsError: false,
    retryProjects: vi.fn(),
  }
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/" element={<Outlet context={context} />}>
          <Route
            index
            element={
              <>
                <TodayPage />
                <Search />
              </>
            }
          />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}

const lastQuickFilters = () =>
  (dailyRaidsArgs.at(-1)?.[1] as { quickFilters: unknown }).quickFilters

describe("Today quick filters", () => {
  beforeEach(() => {
    dailyRaidsArgs.length = 0
  })

  it("starts with both chips off and no note", () => {
    renderToday()
    expect(screen.getByTestId("today-quick-filters")).toBeInTheDocument()
    expect(lastQuickFilters()).toEqual({
      fewerRaids: false,
      combineGoals: false,
    })
    expect(
      screen.queryByTestId("today-quick-filter-note-fewerRaids")
    ).not.toBeInTheDocument()
    expect(screen.getByTestId("search")).toHaveTextContent("")
  })

  it("turns chips on together, explains each and writes the URL", async () => {
    const user = userEvent.setup()
    renderToday()

    await user.click(screen.getByTestId("today-quick-filter-bottlenecks"))
    expect(lastQuickFilters()).toEqual({
      fewerRaids: false,
      combineGoals: true,
    })
    expect(
      screen.getByTestId("today-quick-filter-note-bottlenecks")
    ).toBeInTheDocument()
    expect(screen.getByTestId("search")).toHaveTextContent("?quick=bottlenecks")

    await user.click(screen.getByTestId("today-quick-filter-fewerRaids"))
    expect(lastQuickFilters()).toEqual({ fewerRaids: true, combineGoals: true })
    expect(
      screen.getByTestId("today-quick-filter-note-fewerRaids")
    ).toBeInTheDocument()
    expect(screen.getByTestId("search")).toHaveTextContent(
      "?quick=fewerRaids%2Cbottlenecks"
    )

    await user.click(screen.getByTestId("today-quick-filter-bottlenecks"))
    await user.click(screen.getByTestId("today-quick-filter-fewerRaids"))
    expect(lastQuickFilters()).toEqual({
      fewerRaids: false,
      combineGoals: false,
    })
    expect(screen.getByTestId("search")).toHaveTextContent("")
  })

  it("restores chips from the URL and ignores unknown values", () => {
    renderToday("/?quick=fewerRaids,nope")
    expect(lastQuickFilters()).toEqual({
      fewerRaids: true,
      combineGoals: false,
    })
    expect(screen.getByTestId("today-quick-filter-fewerRaids")).toHaveAttribute(
      "data-state",
      "on"
    )
  })
})

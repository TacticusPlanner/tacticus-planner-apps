import { MemoryRouter, Outlet, Route, Routes, useLocation } from "react-router"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { render, screen } from "@/test/render"
import { ready } from "@/test/fixtures/daily-raids"

import type { DailiesOutletContext } from "./dailies-layout"
import { TodayPage } from "./today-page"

const { dailyRaidsArgs, plan, flags } = vi.hoisted(() => ({
  dailyRaidsArgs: [] as unknown[][],
  plan: { hasManualRaids: false },
  flags: { manualBattles: true },
}))

vi.mock("@/shared/feature-flags", () => ({
  useFeatureFlag: (flag: string) =>
    flag === "ManualBattles" && flags.manualBattles,
}))

vi.mock("@/features/daily-raids", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/daily-raids")>()
  return {
    ...actual,
    useDailyRaids: (...args: unknown[]) => {
      dailyRaidsArgs.push(args)
      return { ...ready(), hasManualRaids: plan.hasManualRaids }
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
    plan.hasManualRaids = false
    flags.manualBattles = true
  })

  it("starts with both chips off and no note", () => {
    renderToday()
    expect(screen.getByTestId("today-quick-filters")).toBeInTheDocument()
    expect(lastQuickFilters()).toEqual({
      fewerRaids: false,
      combineGoals: false,
      raidableOnly: false,
    })
    expect(
      screen.queryByTestId("today-quick-filter-note-fewerRaids")
    ).not.toBeInTheDocument()
    expect(screen.getByTestId("search")).toHaveTextContent("")
  })

  it("turns chips on together, explains each and writes the URL", async () => {
    const user = userEvent.setup()
    renderToday()

    await user.click(screen.getByTestId("today-quick-filter-combineGoals"))
    expect(lastQuickFilters()).toEqual({
      fewerRaids: false,
      combineGoals: true,
      raidableOnly: false,
    })
    expect(
      screen.getByTestId("today-quick-filter-note-combineGoals")
    ).toBeInTheDocument()
    expect(screen.getByTestId("search")).toHaveTextContent(
      "?quick=combineGoals"
    )

    await user.click(screen.getByTestId("today-quick-filter-fewerRaids"))
    expect(lastQuickFilters()).toEqual({
      fewerRaids: true,
      combineGoals: true,
      raidableOnly: false,
    })
    expect(
      screen.getByTestId("today-quick-filter-note-fewerRaids")
    ).toBeInTheDocument()
    expect(screen.getByTestId("search")).toHaveTextContent(
      "?quick=fewerRaids%2CcombineGoals"
    )

    await user.click(screen.getByTestId("today-quick-filter-combineGoals"))
    await user.click(screen.getByTestId("today-quick-filter-fewerRaids"))
    expect(lastQuickFilters()).toEqual({
      fewerRaids: false,
      combineGoals: false,
      raidableOnly: false,
    })
    expect(screen.getByTestId("search")).toHaveTextContent("")
  })

  it("reopens Bonus raids on its top 3 when a quick filter changes", async () => {
    const user = userEvent.setup()
    renderToday()

    await user.click(screen.getByRole("button", { name: "Show 1 more" }))
    expect(
      screen.getByRole("button", { name: "Show less" })
    ).toBeInTheDocument()

    await user.click(screen.getByTestId("today-quick-filter-combineGoals"))
    expect(
      screen.queryByRole("button", { name: "Show less" })
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Show 1 more" })
    ).toBeInTheDocument()
  })

  it("restores chips from the URL and ignores unknown values", () => {
    renderToday("/?quick=fewerRaids,nope")
    expect(lastQuickFilters()).toEqual({
      fewerRaids: true,
      combineGoals: false,
      raidableOnly: false,
    })
    expect(screen.getByTestId("today-quick-filter-fewerRaids")).toHaveAttribute(
      "data-state",
      "on"
    )
  })

  it("reads an old Bottlenecks link as Combine goals", () => {
    renderToday("/?quick=bottlenecks")
    expect(lastQuickFilters()).toEqual({
      fewerRaids: false,
      combineGoals: true,
      raidableOnly: false,
    })
    expect(
      screen.getByTestId("today-quick-filter-combineGoals")
    ).toHaveAttribute("data-state", "on")
  })

  it("offers Raidable only only while today's plan raids a manual battle", async () => {
    renderToday()
    expect(
      screen.queryByTestId("today-quick-filter-raidableOnly")
    ).not.toBeInTheDocument()

    plan.hasManualRaids = true
    const user = userEvent.setup()
    renderToday()
    await user.click(
      screen.getAllByTestId("today-quick-filter-raidableOnly")[0]!
    )
    expect(lastQuickFilters()).toEqual({
      fewerRaids: false,
      combineGoals: false,
      raidableOnly: true,
    })
  })

  it("keeps Raidable only visible while it is on, so it can be turned off", () => {
    renderToday("/?quick=raidableOnly")
    expect(lastQuickFilters()).toEqual({
      fewerRaids: false,
      combineGoals: false,
      raidableOnly: true,
    })
    expect(
      screen.getByTestId("today-quick-filter-raidableOnly")
    ).toHaveAttribute("data-state", "on")
  })

  it("never offers Raidable only while manual battles are off", () => {
    flags.manualBattles = false
    plan.hasManualRaids = true
    renderToday("/?quick=raidableOnly")
    expect(
      screen.queryByTestId("today-quick-filter-raidableOnly")
    ).not.toBeInTheDocument()
  })
})

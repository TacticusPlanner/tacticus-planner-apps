import { useState } from "react"
import { MemoryRouter, Outlet, Route, Routes } from "react-router"
import { within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@/test/render"

import { battle, offPlanBattle, ready } from "@/test/fixtures/daily-raids"
import type { DailiesOutletContext } from "./dailies-layout"
import { TodayPage } from "./today-page"

const useDailyRaids = vi.fn()
const registeredTours: unknown[] = []
const { useIsMobileMock } = vi.hoisted(() => ({
  useIsMobileMock: vi.fn(() => false),
}))

vi.mock("react-i18next", () => ({
  initReactI18next: { type: "3rdParty", init: vi.fn() },
  useTranslation: () => ({
    t: (key: string, values?: Record<string, unknown>) =>
      values ? `${key}:${JSON.stringify(values)}` : key,
  }),
}))
vi.mock("@/features/daily-raids", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/daily-raids")>()
  return {
    ...actual,
    useDailyRaids: () => useDailyRaids(),
  }
})
vi.mock("@/shared/tour", () => ({
  useTourPageSteps: (steps: unknown) => registeredTours.push(steps),
}))
vi.mock("@workspace/ui/hooks/use-mobile", () => ({
  useIsMobile: () => useIsMobileMock(),
}))

const retryProjects = vi.fn()
let contextOverrides: Partial<DailiesOutletContext> = {}

function ContextRoute() {
  const [projectId, setProjectId] = useState<string | undefined>("p1")
  const [projectsError, setProjectsError] = useState(
    contextOverrides.projectsError ?? false
  )
  const context: DailiesOutletContext = {
    projects: [],
    projectId,
    setProjectId,
    projectsUnavailable: false,
    ...contextOverrides,
    projectsError,
    retryProjects: () => {
      retryProjects()
      setProjectsError(false)
    },
  }
  return <Outlet context={context} />
}

function pageTree(element: React.ReactNode) {
  return (
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<ContextRoute />}>
          <Route index element={element} />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}

function renderPage(element: React.ReactNode) {
  return render(pageTree(element))
}

describe("Dailies raid pages", () => {
  beforeEach(() => {
    registeredTours.length = 0
    contextOverrides = {}
    retryProjects.mockClear()
    useDailyRaids.mockReturnValue(ready())
    useIsMobileMock.mockReturnValue(false)
  })

  it("groups the same resource under both contributing goals and reveals bonus entries after three", async () => {
    const user = userEvent.setup()
    renderPage(<TodayPage />)

    expect(screen.getAllByText("Bellator").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Aleph-Null").length).toBeGreaterThan(0)
    // The same resource (Ceramite/U1) is grouped under both contributing goals — its name only
    // renders as visible text for the merged shard-identity card (g1); for g2 it's icon+tooltip
    // only, so the grouping is verified via each goal's own resource card existing instead.
    expect(screen.getByTestId("raid-card-g1-U1")).toBeInTheDocument()
    expect(screen.getByTestId("raid-card-g2-U1")).toBeInTheDocument()
    const todaySchedule = within(screen.getByTestId("today-schedule"))
    // Bonus Raids is its own grouping context again (a labeled continuation, not merged data), so
    // a goal with multiple bonus resources (not eligible for the combined-shard-identity merge)
    // gets its own separate goal header there too, in addition to Today's merged card.
    expect(todaySchedule.getAllByText("Bellator")).toHaveLength(2)
    expect(todaySchedule.getAllByText("Aleph-Null")).toHaveLength(2)
    expect(todaySchedule.getAllByText(/Indomitus/)).not.toHaveLength(0)
    expect(todaySchedule.getByText(/265 \/ 500/)).toBeInTheDocument()
    expect(
      todaySchedule.getByLabelText(
        'schedule.progress:{"owned":265,"target":500}'
      )
    ).toBeInTheDocument()
    expect(screen.getAllByTestId("raid-resource-icon").length).toBeGreaterThan(
      0
    )
    expect(
      screen.getAllByRole("img", { name: "Bellator" }).length
    ).toBeGreaterThan(0)
    expect(screen.getByTestId("today-raid-list")).toHaveClass(
      "md:columns-[20rem]"
    )
    expect(screen.queryByTestId("raid-card-g2-B4")).not.toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "bonus.showMore" }))
    expect(screen.getByTestId("raid-card-g2-B4")).toBeInTheDocument()
    expect(registeredTours.at(-1)).toMatchObject({
      desktop: expect.any(Array),
      mobile: expect.any(Array),
    })
  })

  it("shows the real energy-usage percentage next to the title, uncapped above 100%", () => {
    useDailyRaids.mockReturnValue(
      ready({ dailyEnergy: 100, realEnergyUsedToday: 150 })
    )
    renderPage(<TodayPage />)

    const bar = screen.getByTestId("energy-usage-bar")
    expect(bar).toHaveAttribute("aria-label", "today.energyUsage.label")
    expect(bar).toHaveAttribute(
      "aria-valuetext",
      'today.energyUsage.value:{"percent":150}'
    )
    expect(screen.getByText("150%")).toBeInTheDocument()
  })

  it("splits the header into an energy half and a campaign-event half, energy first", () => {
    useDailyRaids.mockReturnValue(
      ready({ dailyEnergy: 100, realEnergyUsedToday: 42 })
    )
    renderPage(<TodayPage />)

    const status = screen.getByTestId("campaign-event-status")
    const energyRow = screen.getByTestId("energy-usage")
    // One element in one DOM position: the energy half comes first, so the campaign event reads
    // second stacked on mobile and sits right of it on desktop.
    expect(
      energyRow.compareDocumentPosition(status) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
    // Both halves are equal-width siblings of the same desktop flex row.
    const half = status.previousElementSibling
    expect(half).toContainElement(energyRow)
    expect(half).toHaveClass("md:w-1/2")
    expect(status).toHaveClass("md:w-1/2")
    // The bar still leads its own row and the percentage still trails it.
    expect(energyRow.firstElementChild).toBe(
      screen.getByTestId("energy-usage-bar")
    )
    expect(energyRow.lastElementChild?.textContent).toBe("42%")
  })

  it("shows 0% energy usage when there are no real attempts today", () => {
    useDailyRaids.mockReturnValue(
      ready({ dailyEnergy: 288, realEnergyUsedToday: 0 })
    )
    renderPage(<TodayPage />)

    expect(screen.getByText("0%")).toBeInTheDocument()
  })

  it("shows every real attempt today in Today's Attempts with its actual numeric count", () => {
    useDailyRaids.mockReturnValue(
      ready({
        todaysAttempts: [
          { battleId: battle, attemptsUsed: 10, attemptsLeft: 0 },
        ],
      })
    )
    renderPage(<TodayPage />)

    const todaysAttempts = within(screen.getByTestId("todays-attempts"))
    expect(todaysAttempts.getByText("Indomitus")).toBeInTheDocument()
    expect(todaysAttempts.getByText("Elite 1")).toBeInTheDocument()
    expect(
      todaysAttempts.getByText('schedule.raids:{"count":10}')
    ).toBeInTheDocument()
    expect(
      todaysAttempts.queryByText("schedule.maxRaids")
    ).not.toBeInTheDocument()
  })

  it("splits a storyline elite node across two lines in Today's schedule", () => {
    useDailyRaids.mockReturnValue(ready())
    renderPage(<TodayPage />)

    const row = within(screen.getAllByTestId(`raid-location-${battle}`)[0]!)
    expect(row.getByText("Indomitus")).toBeInTheDocument()
    expect(row.getByText("Elite 1")).toBeInTheDocument()
  })

  it("renders only the battle id, with no second line, for an attempt the catalog cannot name", () => {
    useDailyRaids.mockReturnValue(
      ready({
        locationsByBattleId: new Map(),
        todaysAttempts: [
          { battleId: battle, attemptsUsed: 2, attemptsLeft: 4 },
        ],
      })
    )
    renderPage(<TodayPage />)

    const lines = screen
      .getByTestId(`todays-attempt-${battle}`)
      .querySelectorAll(".truncate")
    expect([...lines].map((line) => line.textContent)).toEqual([battle])
  })

  it("shows a resource icon for an attempt at a node outside this project's plan", () => {
    useDailyRaids.mockReturnValue(
      ready({
        todaysAttempts: [
          { battleId: offPlanBattle, attemptsUsed: 3, attemptsLeft: 3 },
        ],
      })
    )
    renderPage(<TodayPage />)

    const attempt = within(
      screen.getByTestId(`todays-attempt-${offPlanBattle}`)
    )
    expect(attempt.getByTestId("raid-resource-icon")).toBeInTheDocument()
    expect(attempt.getByText("Death Guard")).toBeInTheDocument()
    expect(attempt.getByText("Extremis 3")).toBeInTheDocument()
  })

  it("lets this project's plan name the resource for a node it does farm", () => {
    useDailyRaids.mockReturnValue(
      ready({
        todaysAttempts: [
          { battleId: battle, attemptsUsed: 10, attemptsLeft: 0 },
        ],
      })
    )
    renderPage(<TodayPage />)

    const attempt = within(screen.getByTestId(`todays-attempt-${battle}`))
    expect(attempt.getByTestId("raid-resource-icon")).toBeInTheDocument()
    expect(attempt.getByAltText("Ceramite")).toBeInTheDocument()
  })

  it("shows a raids-performed badge for an attempt that still has real attempts left", () => {
    useDailyRaids.mockReturnValue(
      ready({
        todaysAttempts: [
          { battleId: battle, attemptsUsed: 4, attemptsLeft: 6 },
        ],
      })
    )
    renderPage(<TodayPage />)

    const todaysAttempts = within(screen.getByTestId("todays-attempts"))
    expect(
      todaysAttempts.getByText('schedule.raids:{"count":4}')
    ).toBeInTheDocument()
  })

  it("shows an empty state when nothing has been attempted yet today", () => {
    useDailyRaids.mockReturnValue(ready({ todaysAttempts: [] }))
    renderPage(<TodayPage />)

    const todaysAttempts = within(screen.getByTestId("todays-attempts"))
    expect(todaysAttempts.getByText("todaysAttempts.empty")).toBeInTheDocument()
  })

  it("de-dupes a location out of Today's Raids once it has zero real attempts left", () => {
    useDailyRaids.mockReturnValue(
      ready({ attemptsLeftByBattle: new Map([[battle, 0]]) })
    )
    renderPage(<TodayPage />)

    const todaySchedule = within(screen.getByTestId("today-schedule"))
    expect(todaySchedule.queryByText("Indomitus")).not.toBeInTheDocument()
  })

  it.each(["no-goals", "no-farmable", "error"] as const)(
    "renders the %s state",
    (status) => {
      useDailyRaids.mockReturnValue({ status })
      renderPage(<TodayPage />)
      expect(screen.getByTestId(`dailies-${status}`)).toBeInTheDocument()
    }
  )
  it("does not show the blocker panel on Today, only its actionable schedule", () => {
    useDailyRaids.mockReturnValue(
      ready({
        blockedGoals: [
          {
            goalId: "g1",
            partial: true,
            blockers: [
              {
                resourceId: "U2" as never,
                reason: "NoFarmLocation",
                remaining: 6,
              },
            ],
          },
        ],
      })
    )
    renderPage(<TodayPage />)

    expect(screen.queryByTestId("plan-blockers")).not.toBeInTheDocument()
    expect(screen.getByTestId("today-schedule")).toBeInTheDocument()
  })
})

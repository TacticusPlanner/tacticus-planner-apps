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
    const todaySchedule = within(screen.getByTestId("today-grid"))
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
    // A goal group's cards spread over the plan card's width instead of one column.
    expect(
      within(screen.getByTestId("today-raid-list")).getByTestId(
        "raid-resource-grid-g1"
      )
    ).toHaveClass("md:grid-cols-[repeat(auto-fill,minmax(20rem,1fr))]")
    expect(screen.queryByTestId("raid-card-g2-B4")).not.toBeInTheDocument()
    expect(screen.getByTestId("bonus-card")).toBeInTheDocument()
    expect(
      screen.queryByTestId("bonus-energy-limit-reached")
    ).not.toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "bonus.showMore" }))
    expect(screen.getByTestId("raid-card-g2-B4")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "bonus.showLess" }))
    expect(screen.queryByTestId("raid-card-g2-B4")).not.toBeInTheDocument()
    expect(registeredTours.at(-1)).toMatchObject({
      desktop: expect.any(Array),
      mobile: expect.any(Array),
    })
  })

  it("lists today's Onslaught runs per unit, in goal priority, with the tokens to spend", () => {
    const base = ready()
    useDailyRaids.mockReturnValue(
      ready({
        today: {
          ...base.today,
          onslaughtEntries: [
            { goalId: "g2", runs: 0.5, expectedShards: 2 },
            { goalId: "g1", runs: 1.2, expectedShards: 6 },
          ],
        },
      })
    )
    renderPage(<TodayPage />)

    const section = within(screen.getByTestId("today-onslaught"))
    expect(
      section.getByRole("heading", { level: 2, name: "plan.onslaught" })
    ).toBeInTheDocument()
    expect(
      section
        .getAllByRole("listitem")
        .map((row) => row.getAttribute("data-testid"))
    ).toEqual(["today-onslaught-bellator", "today-onslaught-alephNull"])
    // 1.7 expected runs need 2 whole tokens.
    expect(
      section.getByText('today.onslaughtSummary:{"runs":2}')
    ).toBeInTheDocument()
  })

  it("leaves the Onslaught section out when no goal needs a run today", () => {
    renderPage(<TodayPage />)
    expect(screen.queryByTestId("today-onslaught")).not.toBeInTheDocument()
  })

  it("starts its hierarchy at h2 under the shell h1, one per card", () => {
    renderPage(<TodayPage />)
    // The shell header owns the page h1; each dashboard card starts its own hierarchy at h2.
    expect(screen.queryAllByRole("heading", { level: 1 })).toHaveLength(0)
    expect(
      screen.getByRole("heading", { level: 2, name: "today.plan" })
    ).toBeInTheDocument()
    expect(screen.getByRole("region", { name: "today.plan" })).toHaveAttribute(
      "data-testid",
      "today-plan-card"
    )
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
    // The bar fills to 100% while its value text keeps the real 150%.
    expect(bar).toHaveAttribute("aria-valuenow", "100")
  })

  it("shows the energy and the campaign event as glance tiles, energy first", () => {
    useDailyRaids.mockReturnValue(
      ready({ dailyEnergy: 100, realEnergyUsedToday: 42 })
    )
    renderPage(<TodayPage />)

    const glance = screen.getByRole("region", { name: "today.glance.label" })
    const status = screen.getByTestId("campaign-event-status")
    const energyTile = screen.getByTestId("energy-usage")
    expect(glance).toContainElement(energyTile)
    expect(glance).toContainElement(status)
    expect(
      energyTile.compareDocumentPosition(status) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
    expect(within(energyTile).getByRole("term")).toHaveTextContent(
      "today.energyUsage.label"
    )
    expect(within(energyTile).getByText("42%")).toBeInTheDocument()
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
      todaysAttempts.getByText('todaysAttempts.count:{"count":10}')
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
      .querySelectorAll(".break-words")
    expect([...lines].map((line) => line.textContent)).toEqual([battle])
  })

  it("wraps a long localized campaign name and node label in full instead of truncating them", () => {
    const campaignName = "Adeptus Mechanicus – Kampagnenereignis"
    const nodeLabel = "Extremis 12B (Herausforderungsknoten)"
    useDailyRaids.mockReturnValue(
      ready({
        locationsByBattleId: new Map([
          [
            battle,
            {
              id: battle,
              campaignName,
              nodeLabel,
              shortLabel: "AdMech EX 12B",
              challenge: true,
            },
          ],
        ]),
        todaysAttempts: [
          { battleId: battle, attemptsUsed: 2, attemptsLeft: 4 },
        ],
      })
    )
    renderPage(<TodayPage />)

    const attempt = within(screen.getByTestId(`todays-attempt-${battle}`))
    // Campaign and node share one compact line that wraps instead of truncating.
    for (const label of [campaignName, nodeLabel]) {
      const line = attempt.getByText(label).closest(".break-words")
      expect(line).not.toBeNull()
      expect(line).not.toHaveClass("truncate")
      expect(line).toHaveTextContent(`${campaignName} ${nodeLabel}`)
    }
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
      todaysAttempts.getByText('todaysAttempts.count:{"count":4}')
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

    const todaySchedule = within(screen.getByTestId("today-grid"))
    expect(todaySchedule.queryByText("Indomitus")).not.toBeInTheDocument()
  })

  it("makes Bonus Raids the only raids list, in the plan's place, once today's energy spend reaches the daily limit", () => {
    useDailyRaids.mockReturnValue(
      ready({ dailyEnergy: 288, realEnergyUsedToday: 288 })
    )
    renderPage(<TodayPage />)

    expect(screen.queryByTestId("today-plan-card")).not.toBeInTheDocument()
    const bonusCard = within(screen.getByTestId("today-plan-area")).getByTestId(
      "bonus-card"
    )
    expect(bonusCard).toHaveAttribute("data-limit", "reached")
    const bonus = within(bonusCard)
    // The plan's own material keeps its remaining farming, ahead of the bonus materials.
    expect(bonus.getByTestId("raid-card-g1-U1")).toBeInTheDocument()
    expect(bonus.getByText("bonus.title")).toBeInTheDocument()
    expect(bonus.getByTestId("bonus-energy-limit-reached")).toHaveTextContent(
      "bonus.limitReached"
    )
    expect(bonus.getByTestId("raid-card-g1-B1")).toBeInTheDocument()
    // Every raid left today is listed, with no Show more.
    expect(bonus.getByTestId("raid-card-g2-B4")).toBeInTheDocument()
    expect(
      bonus.queryByRole("button", { name: "bonus.showMore" })
    ).not.toBeInTheDocument()
    // The energy tile switches to its over-limit state.
    expect(
      within(screen.getByTestId("energy-usage")).getByRole("term")
    ).toHaveTextContent("today.glance.energyOver")
  })

  it("keeps Today's plan one energy short of the daily limit", () => {
    useDailyRaids.mockReturnValue(
      ready({ dailyEnergy: 288, realEnergyUsedToday: 287 })
    )
    renderPage(<TodayPage />)

    expect(screen.getByTestId("today-plan-card")).toBeInTheDocument()
    expect(
      screen.queryByTestId("bonus-energy-limit-reached")
    ).not.toBeInTheDocument()
  })

  it("says the limit is reached with no bonus raids left instead of a plan", () => {
    const base = ready()
    useDailyRaids.mockReturnValue(
      ready({
        dailyEnergy: 100,
        realEnergyUsedToday: 150,
        raidsLeftToday: { ...base.raidsLeftToday, entries: [] },
      })
    )
    renderPage(<TodayPage />)

    expect(screen.queryByTestId("today-plan-card")).not.toBeInTheDocument()
    expect(screen.getByTestId("bonus-energy-limit-reached")).toHaveTextContent(
      "bonus.limitReachedEmpty"
    )
    expect(screen.queryByTestId("bonus-raid-list")).not.toBeInTheDocument()
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
    expect(screen.getByTestId("today-raid-list")).toBeInTheDocument()
  })
})

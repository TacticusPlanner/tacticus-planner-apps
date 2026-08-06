import { useState } from "react"
import { MemoryRouter, Outlet, Route, Routes } from "react-router"
import { within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { battleIdSchema } from "@workspace/game-domain"

import { render, screen } from "@/test/render"

import type { DailyRaidsReadyViewModel } from "../model/daily-raids.domain"
import type { DailiesOutletContext } from "./dailies-layout"
import { RaidsPlanPage } from "./raids-plan-page"
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
vi.mock("../model/use-daily-raids", () => ({
  useDailyRaids: (projectId: string | undefined) => useDailyRaids(projectId),
}))
vi.mock("@/shared/tour", () => ({
  useTourPageSteps: (steps: unknown) => registeredTours.push(steps),
}))
vi.mock("@workspace/ui/hooks/use-mobile", () => ({
  useIsMobile: () => useIsMobileMock(),
}))

const battle = battleIdSchema.parse("B1")
const retryProjects = vi.fn()
let contextOverrides: Partial<DailiesOutletContext> = {}

function ready(
  overrides: Partial<DailyRaidsReadyViewModel> = {}
): DailyRaidsReadyViewModel {
  const goalsById = new Map([
    [
      "g1",
      {
        goalId: "g1",
        priority: 1,
        unitId: "bellator" as never,
        unitType: "Character" as const,
        unitLabel: "Bellator",
        targetLabel: "Rank Gold1",
        goalKind: "Rank" as const,
        targetRank: "Gold1" as never,
      },
    ],
    [
      "g2",
      {
        goalId: "g2",
        priority: 2,
        unitId: "alephNull" as never,
        unitType: "Character" as const,
        unitLabel: "Aleph-Null",
        targetLabel: "Rank Silver1",
        goalKind: "Rank" as const,
        targetRank: "Silver1" as never,
      },
    ],
  ])
  const entry = (goalId: string, resourceId: string, raidsPerformed = 2) => ({
    goalId,
    resourceId: resourceId as never,
    battleId: battle,
    raidsPerformed,
    itemsFarmed: raidsPerformed,
    energySpent: raidsPerformed * 6,
    dailyAttempts: 10,
  })
  const todayEntries = [entry("g1", "U1", 4), entry("g2", "U1", 3)]
  const day = (number: number) => ({
    day: number,
    entries: [entry("g1", `U${number}`)],
    attemptsUsedByBattle: new Map([[battle, 2]]),
    energyTotal: 12,
    raidsTotal: 2,
  })
  return {
    status: "ready",
    today: {
      day: 1,
      entries: todayEntries,
      attemptsUsedByBattle: new Map([[battle, 7]]),
      energyTotal: 42,
      raidsTotal: 7,
    },
    bonus: {
      day: 1,
      entries: [
        entry("g1", "B1"),
        entry("g1", "B2"),
        entry("g2", "B3"),
        entry("g2", "B4"),
      ],
      attemptsUsedByBattle: new Map([[battle, 8]]),
      energyTotal: 48,
      raidsTotal: 8,
    },
    planDays: [day(1), day(2), day(3), day(4), day(5)],
    planSummary: {
      totalDays: 5,
      totalEnergy: 200,
      totalRaids: 30,
      daysWithUnusedEnergy: 2,
      completionDate: "2026-01-06",
    },
    dailyEnergy: 288,
    goalsById,
    resourceLabels: new Map([
      ["U1", "Ceramite"],
      ["B1", "Bonus 1"],
      ["B2", "Bonus 2"],
      ["B3", "Bonus 3"],
      ["B4", "Bonus 4"],
      ["U2", "Day 2"],
      ["U3", "Day 3"],
      ["U4", "Day 4"],
      ["U5", "Day 5"],
    ]),
    resourceVisuals: new Map(
      ["U1", "B1", "B2", "B3", "B4", "U2", "U3", "U4", "U5"].map((id) => [
        id,
        { kind: "shard" as const, unitId: "bellator" as never },
      ])
    ),
    resourceProgressByDay: new Map([
      [
        1,
        new Map([
          ["g1:U1", { owned: 265, target: 500 }],
          ["g2:U1", { owned: 20, target: 40 }],
        ]),
      ],
    ]),
    locationsByBattleId: new Map([
      [
        battle,
        {
          id: battle,
          fullName: "Indomitus Elite",
          shortLabel: "Indomitus I 1",
          nodeNumber: 1,
          challenge: false,
          icon: "/campaign.png",
        },
      ],
    ]),
    attemptsUsedByBattle: new Map([[battle, 7]]),
    realEnergyUsedToday: 120,
    attemptsLeftByBattle: new Map([[battle, 3]]),
    todaysAttempts: [],
    ...overrides,
  }
}

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

function renderPage(element: React.ReactNode) {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<ContextRoute />}>
          <Route index element={element} />
        </Route>
      </Routes>
    </MemoryRouter>
  )
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
    expect(todaySchedule.getAllByText(/Indomitus Elite/)).not.toHaveLength(0)
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

  it("shows 0% energy usage when there are no real attempts today", () => {
    useDailyRaids.mockReturnValue(
      ready({ dailyEnergy: 288, realEnergyUsedToday: 0 })
    )
    renderPage(<TodayPage />)

    expect(screen.getByText("0%")).toBeInTheDocument()
  })

  it("shows every real attempt today in Today's Attempts, account-wide, labeling exhausted locations distinctly", () => {
    useDailyRaids.mockReturnValue(
      ready({
        todaysAttempts: [
          { battleId: battle, attemptsUsed: 10, attemptsLeft: 0 },
        ],
      })
    )
    renderPage(<TodayPage />)

    const todaysAttempts = within(screen.getByTestId("todays-attempts"))
    expect(todaysAttempts.getByText("Indomitus Elite")).toBeInTheDocument()
    expect(todaysAttempts.getByText("schedule.maxRaids")).toBeInTheDocument()
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
    expect(todaySchedule.queryByText("Indomitus Elite")).not.toBeInTheDocument()
  })

  it.each(["no-project", "no-farmable", "error"] as const)(
    "renders the %s state",
    (status) => {
      useDailyRaids.mockReturnValue({ status })
      renderPage(<TodayPage />)
      expect(screen.getByTestId(`dailies-${status}`)).toBeInTheDocument()
    }
  )

  it("shows a retry action for project-list failures", async () => {
    const user = userEvent.setup()
    contextOverrides = { projectsError: true }
    renderPage(<TodayPage />)

    await user.click(screen.getByRole("button", { name: "empty.retry" }))
    expect(retryProjects).toHaveBeenCalledOnce()
    expect(screen.queryByTestId("dailies-error")).not.toBeInTheDocument()
    expect(screen.getByTestId("today-page")).toBeInTheDocument()
  })

  it("starts the plan with Today, paginates, and toggles detail density", async () => {
    const user = userEvent.setup()
    renderPage(<RaidsPlanPage />)

    expect(screen.getByTestId("plan-day-1")).toBeInTheDocument()
    expect(screen.getByText("raids.tabs.today")).toBeInTheDocument()
    expect(screen.getByTestId("plan-day-2")).toBeInTheDocument()
    expect(screen.getByTestId("plan-day-3")).toBeInTheDocument()
    expect(screen.queryByTestId("plan-day-4")).not.toBeInTheDocument()
    expect(screen.queryByTestId("plan-day-5")).not.toBeInTheDocument()
    expect(screen.getByText("200")).toBeInTheDocument()
    expect(screen.getByTestId("plan-days")).toHaveClass(
      "md:[grid-template-columns:repeat(auto-fit,minmax(20rem,24rem))]"
    )
    // Collapse/Expand and "Show all days" both live inside the whole-plan summary area.
    const summary = screen.getByTestId("plan-summary")
    expect(
      within(summary).getByRole("button", { name: "plan.showAll" })
    ).toBeInTheDocument()
    expect(
      within(summary).getByRole("button", { name: "plan.collapse" })
    ).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "plan.showAll" }))
    expect(screen.getByTestId("plan-day-5")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "plan.collapse" }))
    expect(screen.queryByText(/schedule.node/)).not.toBeInTheDocument()
    expect(registeredTours.at(-1)).toMatchObject({
      desktop: expect.any(Array),
      mobile: expect.any(Array),
    })
  })

  it("compresses the density toggle to icon-only on mobile while keeping Show all days as text, both still inside the summary area", () => {
    useIsMobileMock.mockReturnValue(true)
    renderPage(<RaidsPlanPage />)

    const summary = screen.getByTestId("plan-summary")
    const densityToggle = within(summary).getByTestId("plan-density-toggle")
    expect(densityToggle).not.toHaveTextContent("plan.collapse")
    expect(densityToggle).toHaveAccessibleName("plan.collapse")
    expect(
      within(summary).getByRole("button", { name: "plan.showAll" })
    ).toHaveTextContent("plan.showAll")
  })

  it("keeps the current density state on days revealed by Show all days", async () => {
    const user = userEvent.setup()
    renderPage(<RaidsPlanPage />)

    await user.click(screen.getByRole("button", { name: "plan.collapse" }))
    expect(screen.queryByText(/schedule.node/)).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "plan.showAll" }))
    expect(screen.getByTestId("plan-day-5")).toBeInTheDocument()
    expect(screen.queryByText(/schedule.node/)).not.toBeInTheDocument()
  })

  it("still renders Today when the plan completes during Day 1", () => {
    const state = ready()
    useDailyRaids.mockReturnValue(ready({ planDays: [state.today] }))
    renderPage(<RaidsPlanPage />)
    expect(screen.getByTestId("plan-day-1")).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "plan.showAll" })
    ).not.toBeInTheDocument()
  })
})

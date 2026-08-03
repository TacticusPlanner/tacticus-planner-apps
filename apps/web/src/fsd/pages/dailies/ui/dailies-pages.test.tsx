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

vi.mock("react-i18next", () => ({
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

const battle = battleIdSchema.parse("B1")

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
      [battle, { id: battle, label: "Indomitus I 1", icon: "/campaign.png" }],
    ]),
    attemptsUsedByBattle: new Map([[battle, 7]]),
    ...overrides,
  }
}

function ContextRoute() {
  const [projectId, setProjectId] = useState<string | undefined>("p1")
  const context: DailiesOutletContext = {
    projects: [],
    projectId,
    setProjectId,
    projectsUnavailable: false,
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
    useDailyRaids.mockReturnValue(ready())
  })

  it("groups the same resource under both contributing goals and reveals bonus entries after three", async () => {
    const user = userEvent.setup()
    renderPage(<TodayPage />)

    expect(screen.getAllByText("Bellator").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Aleph-Null").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Ceramite")).toHaveLength(2)
    const todaySchedule = within(screen.getByTestId("today-schedule"))
    expect(todaySchedule.getAllByText("Bellator")).toHaveLength(1)
    expect(todaySchedule.getAllByText("Aleph-Null")).toHaveLength(1)
    expect(todaySchedule.getAllByText(/Indomitus I 1/)).not.toHaveLength(0)
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
      "md:[grid-template-columns:repeat(auto-fit,minmax(20rem,1fr))]"
    )
    expect(screen.queryByText("Bonus 4")).not.toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "bonus.showMore" }))
    expect(screen.getByText("Bonus 4")).toBeInTheDocument()
    expect(registeredTours.at(-1)).toMatchObject({
      desktop: expect.any(Array),
      mobile: expect.any(Array),
    })
  })

  it.each(["no-project", "no-farmable", "error"] as const)(
    "renders the %s state",
    (status) => {
      useDailyRaids.mockReturnValue({ status })
      renderPage(<TodayPage />)
      expect(screen.getByTestId(`dailies-${status}`)).toBeInTheDocument()
    }
  )

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
      "md:[grid-template-columns:repeat(auto-fit,minmax(20rem,1fr))]"
    )
    await user.click(screen.getByRole("button", { name: "plan.showAll" }))
    expect(screen.getByTestId("plan-day-5")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "plan.collapse" }))
    expect(screen.queryByText(/schedule.node/)).not.toBeInTheDocument()
    expect(registeredTours.at(-1)).toMatchObject({
      desktop: expect.any(Array),
      mobile: expect.any(Array),
    })
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

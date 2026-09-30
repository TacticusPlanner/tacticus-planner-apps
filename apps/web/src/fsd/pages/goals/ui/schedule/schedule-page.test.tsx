import { act, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { render, screen } from "@/test/render"
import {
  battle,
  offPlanBattle,
  raidedPlan,
  ready,
} from "@/test/fixtures/daily-raids"

import { SchedulePage } from "./schedule-page"

const useDailyRaids = vi.fn()
const useProjects = vi.fn()
const registeredTours: unknown[] = []
const { useIsMobileMock } = vi.hoisted(() => ({
  useIsMobileMock: vi.fn(() => false),
}))

vi.mock("react-i18next", () => ({
  initReactI18next: { type: "3rdParty", init: vi.fn() },
  useTranslation: () => ({
    i18n: { language: "en" },
    t: (key: string, values?: Record<string, unknown>) =>
      values ? `${key}:${JSON.stringify(values)}` : key,
  }),
}))
vi.mock("@/features/daily-raids", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/daily-raids")>()
  return {
    ...actual,
    useDailyRaids: (projectId?: string) => useDailyRaids(projectId),
  }
})
vi.mock("@/entities/project", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/entities/project")>()
  return { ...actual, useProjects: () => useProjects() }
})
vi.mock("@/entities/planning-setting", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/entities/planning-setting")>()
  return {
    ...actual,
    dailyEnergyTiers: [288, 378, 438, 538, 638, 738, 838, 938],
    usePlanningSettings: () => ({
      settings: { dailyEnergy: 288, revision: 1 },
      save: vi.fn(),
    }),
  }
})
vi.mock("@/shared/tour", () => ({
  useTourPageSteps: (steps: unknown) => registeredTours.push(steps),
}))
vi.mock("@workspace/ui/hooks/use-mobile", () => ({
  useIsMobile: () => useIsMobileMock(),
}))

const projects = [
  {
    projectId: "p1",
    name: "Active project",
    color: null,
    status: "Active",
    isDefault: false,
  },
  {
    projectId: "p2",
    name: "Default project",
    color: null,
    status: "Active",
    isDefault: true,
  },
]
const loadedProjects = {
  projects,
  defaultProjectId: "p2",
  fetchState: { status: "success" },
  loading: false,
}

describe("Schedule page", () => {
  beforeEach(() => {
    registeredTours.length = 0
    useDailyRaids.mockReset()
    useDailyRaids.mockReturnValue(ready())
    useProjects.mockReset()
    useProjects.mockReturnValue(loadedProjects)
    useIsMobileMock.mockReturnValue(false)
  })

  it("defaults its own project selection to all goals and narrows on selection", async () => {
    const user = userEvent.setup()
    render(<SchedulePage />)

    expect(useDailyRaids).toHaveBeenLastCalledWith(undefined)
    await user.click(screen.getByTestId("schedule-project-select"))
    await user.click(
      await screen.findByRole("option", { name: /Active project/ })
    )
    expect(useDailyRaids).toHaveBeenLastCalledWith("p1")
  })

  it("renders the account-wide plan when the project list fails or is empty", () => {
    useProjects.mockReturnValue({
      projects: [],
      defaultProjectId: undefined,
      fetchState: { status: "error", message: "boom" },
      loading: false,
    })
    const { unmount } = render(<SchedulePage />)
    expect(screen.getByTestId("plan-day-1")).toBeInTheDocument()
    expect(screen.queryByTestId("dailies-error")).not.toBeInTheDocument()
    unmount()

    useProjects.mockReturnValue({ ...loadedProjects, projects: [] })
    render(<SchedulePage />)
    expect(screen.getByTestId("plan-day-1")).toBeInTheDocument()
  })

  it("renders the raid states from the goals, not the project list", () => {
    useDailyRaids.mockReturnValue({ status: "no-goals" })
    render(<SchedulePage />)
    expect(screen.getByTestId("dailies-no-goals")).toBeInTheDocument()
    expect(screen.getByTestId("schedule-project-select")).toBeInTheDocument()
  })

  it("trails the project selector with the shared Planning Settings trigger and opens the dialog", async () => {
    const user = userEvent.setup()
    render(<SchedulePage />)

    const select = screen.getByTestId("schedule-project-select")
    const trigger = screen.getByTestId("schedule-planning-settings")
    expect(trigger).toHaveAccessibleName("goals.planningSettings.button")
    expect(
      select.compareDocumentPosition(trigger) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()

    await user.click(trigger)
    expect(
      await screen.findByTestId("planning-settings-dialog")
    ).toBeInTheDocument()
  })

  it("compresses the project selector to an icon on mobile", () => {
    useIsMobileMock.mockReturnValue(true)
    render(<SchedulePage />)

    const select = screen.getByTestId("schedule-project-select")
    expect(select).toHaveAccessibleName("project.placeholder")
    expect(select).not.toHaveTextContent(/\S/)
  })

  describe("partial plan on Raids Plan", () => {
    const page = <SchedulePage />

    it("lists each blocker with its reason and remaining quantity", () => {
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
      render(page)

      const blocker = within(screen.getByTestId("plan-blocker-g1"))
      expect(blocker.getByText("Bellator · Rank Gold1")).toBeInTheDocument()
      expect(blocker.getByText(/blockers\.partial/)).toBeInTheDocument()
      expect(blocker.getByText(/Day 2.*"count":6/)).toBeInTheDocument()
      expect(
        blocker.getByText(/goals\.estimate\.blocked\.NoFarmLocation/)
      ).toBeInTheDocument()
    })

    it("shows no blocker panel when nothing is blocked", () => {
      render(page)
      expect(screen.queryByTestId("plan-blockers")).not.toBeInTheDocument()
    })
  })

  it("shows no completion date on Raids Plan while a goal is blocked", () => {
    useDailyRaids.mockReturnValue(
      ready({
        blockedGoals: [{ goalId: "g1", partial: false, blockers: [] }],
        planSummary: {
          totalDays: 5,
          totalEnergy: 200,
          totalRaids: 30,
          daysWithUnusedEnergy: 2,
          completionDate: null,
        },
      })
    )
    render(<SchedulePage />)

    const summary = within(screen.getByTestId("plan-summary"))
    expect(summary.getByText("plan.summary.noCompletion")).toBeInTheDocument()
    expect(summary.queryByText("2026-01-06")).not.toBeInTheDocument()
  })

  describe("Raids Plan day strip", () => {
    it("starts with Today, Day 2 and Day 3, and reveals the rest from the strip end", async () => {
      const user = userEvent.setup()
      render(<SchedulePage />)

      expect(screen.getByTestId("plan-day-1")).toBeInTheDocument()
      expect(screen.getByText("plan.today")).toBeInTheDocument()
      expect(screen.getByTestId("plan-day-3")).toBeInTheDocument()
      expect(screen.queryByTestId("plan-day-4")).not.toBeInTheDocument()
      expect(screen.getByText("200")).toBeInTheDocument()
      expect(screen.getByTestId("plan-days")).toHaveClass("overflow-x-auto")
      // No density toggle, and "Show all days" lives in the strip rather than the summary.
      expect(
        screen.queryByTestId("plan-density-toggle")
      ).not.toBeInTheDocument()
      expect(
        within(screen.getByTestId("plan-summary")).queryByRole("button")
      ).not.toBeInTheDocument()

      const strip = within(screen.getByTestId("plan-days"))
      await user.click(strip.getByRole("button", { name: "plan.showAll" }))
      expect(screen.getByTestId("plan-day-5")).toBeInTheDocument()
      expect(
        screen.queryByRole("button", { name: "plan.showAll" })
      ).not.toBeInTheDocument()
    })

    it("uses the same strip on mobile", () => {
      useIsMobileMock.mockReturnValue(true)
      render(<SchedulePage />)

      expect(
        within(screen.getByTestId("plan-days")).getByRole("button", {
          name: "plan.showAll",
        })
      ).toBeInTheDocument()
    })

    it("shows each day's localized date, energy total and energy bar", () => {
      vi.useFakeTimers({ toFake: ["Date"] })
      vi.setSystemTime(new Date(2026, 8, 30, 12))
      try {
        const base = ready({ dailyEnergy: 738 })
        useDailyRaids.mockReturnValue({
          ...base,
          planDays: base.planDays.map((day, index) => ({
            ...day,
            energyTotal: [738, 700, 500, 12, 12][index]!,
          })),
        })
        render(<SchedulePage />)

        expect(
          within(screen.getByTestId("plan-day-1")).getByText("September 30")
        ).toBeInTheDocument()
        expect(
          within(screen.getByTestId("plan-day-2")).getByText("October 1")
        ).toBeInTheDocument()
        const bar = (day: number) =>
          screen.getByTestId(`plan-day-${day}-energy-bar`)
        expect(bar(1)).toHaveStyle({ width: "100%" })
        expect(bar(1)).toHaveClass("bg-success-foreground")
        expect(bar(2).style.width).toBe(`${(700 / 738) * 100}%`)
        expect(bar(2)).toHaveClass("bg-amber-500")
        expect(bar(3)).toHaveClass("bg-amber-500")
      } finally {
        vi.useRealTimers()
      }
    })

    it("mounts a card's grid only once it nears the strip", async () => {
      const user = userEvent.setup()
      const callbacks: IntersectionObserverCallback[] = []
      vi.stubGlobal(
        "IntersectionObserver",
        class {
          constructor(callback: IntersectionObserverCallback) {
            callbacks.push(callback)
          }
          observe() {}
          disconnect() {}
        }
      )
      try {
        render(<SchedulePage />)
        await user.click(screen.getByRole("button", { name: "plan.showAll" }))

        expect(screen.getByTestId("plan-day-4")).toBeInTheDocument()
        expect(screen.queryByTestId("plan-day-4-raids")).not.toBeInTheDocument()
        expect(screen.getByTestId("plan-day-1-raids")).toBeInTheDocument()

        act(() =>
          callbacks.at(-1)!(
            [
              {
                isIntersecting: true,
                target: screen.getByTestId("plan-day-4"),
              } as unknown as IntersectionObserverEntry,
            ],
            {} as IntersectionObserver
          )
        )
        expect(screen.getByTestId("plan-day-4-raids")).toBeInTheDocument()
        expect(screen.queryByTestId("plan-day-5-raids")).not.toBeInTheDocument()
      } finally {
        vi.unstubAllGlobals()
      }
    })

    it("cancels native image dragging so a drag that starts on a cell can scroll the strip", () => {
      render(<SchedulePage />)

      const dragStart = new Event("dragstart", {
        bubbles: true,
        cancelable: true,
      })
      screen.getByTestId("plan-cell-1-U1").dispatchEvent(dragStart)

      expect(dragStart.defaultPrevented).toBe(true)
    })

    it("shows the tooltip with units and nodes when a cell is focused", async () => {
      render(<SchedulePage />)

      const cell = screen.getByTestId("plan-cell-1-U1")
      expect(cell).toHaveAccessibleName(
        'plan.cell.label:{"material":"Ceramite","owned":265,"target":500}'
      )
      act(() => cell.focus())
      const tooltip = await screen.findByRole("tooltip")
      expect(tooltip).toHaveTextContent("Ceramite")
      expect(tooltip).toHaveTextContent("Bellator")
      expect(tooltip).toHaveTextContent("Indomitus")
    })
  })

  describe("Raids Plan unit filter", () => {
    function planWithLateSecondUnit() {
      const base = ready()
      const late = base.planDays[4]!
      return ready({
        planDays: [
          ...base.planDays.slice(0, 4),
          {
            ...late,
            entries: [
              ...late.entries,
              { ...late.entries[0]!, goalId: "g2", resourceId: "B1" as never },
            ],
          },
        ],
        resourceProgressByDay: new Map(base.resourceProgressByDay).set(
          5,
          new Map([
            ...base.resourceProgressByDay.get(5)!,
            ["g2:B1", { owned: 0, target: 5 }],
          ])
        ),
      })
    }

    it("reveals every day and scrolls to the unit's first day when it is selected", async () => {
      const user = userEvent.setup()
      const scrolled: Element[] = []
      const spy = vi
        .spyOn(HTMLElement.prototype, "scrollIntoView")
        .mockImplementation(function (this: Element) {
          scrolled.push(this)
        })
      useDailyRaids.mockReturnValue(planWithLateSecondUnit())
      render(<SchedulePage />)
      expect(screen.queryByTestId("plan-day-5")).not.toBeInTheDocument()

      try {
        await user.click(screen.getByRole("button", { name: "Aleph-Null" }))
        expect(scrolled.at(-1)).toBe(screen.getByTestId("plan-day-5"))
      } finally {
        spy.mockRestore()
      }

      expect(screen.getByTestId("plan-day-5")).toBeInTheDocument()
      expect(
        screen.queryByRole("button", { name: "plan.showAll" })
      ).not.toBeInTheDocument()
    })

    it("dims unrelated cells on every card and clears when re-selected", async () => {
      const user = userEvent.setup()
      useDailyRaids.mockReturnValue(raidedPlan([]))
      render(<SchedulePage />)

      const bellator = screen.getByRole("button", { name: "Bellator" })
      expect(bellator).toHaveAttribute("aria-pressed", "false")
      await user.click(bellator)

      expect(bellator).toHaveAttribute("aria-pressed", "true")
      // Day 1's B1 cell serves Aleph-Null only; the U cells serve Bellator.
      expect(screen.getByTestId("plan-cell-1-B1")).toHaveAttribute(
        "data-dimmed",
        "true"
      )
      expect(screen.getByTestId("plan-cell-1-U1")).not.toHaveAttribute(
        "data-dimmed"
      )
      expect(screen.getByTestId("plan-cell-2-U2")).not.toHaveAttribute(
        "data-dimmed"
      )

      await user.click(bellator)
      expect(bellator).toHaveAttribute("aria-pressed", "false")
      expect(screen.getByTestId("plan-cell-1-B1")).not.toHaveAttribute(
        "data-dimmed"
      )
    })

    it("jumps to a unit's last day beyond the revealed days", async () => {
      const user = userEvent.setup()
      const scrolled: Element[] = []
      const spy = vi
        .spyOn(HTMLElement.prototype, "scrollIntoView")
        .mockImplementation(function (this: Element) {
          scrolled.push(this)
        })
      useDailyRaids.mockReturnValue(planWithLateSecondUnit())
      try {
        render(<SchedulePage />)
        expect(screen.queryByTestId("plan-day-5")).not.toBeInTheDocument()

        await user.click(screen.getByRole("button", { name: "Aleph-Null" }))
        // Aleph-Null is only scheduled on Day 5, so the two jumps collapse into one.
        await user.click(
          screen.getByRole("button", { name: 'plan.day:{"day":5}' })
        )

        expect(screen.getByTestId("plan-day-5")).toBeInTheDocument()
        expect(scrolled.at(-1)).toBe(screen.getByTestId("plan-day-5"))
      } finally {
        spy.mockRestore()
      }
    })

    it("offers first and last jumps when the unit spans several days", async () => {
      const user = userEvent.setup()
      useDailyRaids.mockReturnValue(planWithLateSecondUnit())
      render(<SchedulePage />)

      await user.click(screen.getByRole("button", { name: "Bellator" }))
      expect(
        screen.getByRole("button", { name: 'plan.filter.first:{"day":1}' })
      ).toBeInTheDocument()
      expect(
        screen.getByRole("button", { name: 'plan.filter.last:{"day":5}' })
      ).toBeInTheDocument()
    })

    it("shows no filter bar without scheduled units", () => {
      const base = ready()
      useDailyRaids.mockReturnValue(
        ready({
          planDays: base.planDays.map((day) => ({ ...day, entries: [] })),
        })
      )
      render(<SchedulePage />)

      expect(screen.queryByTestId("plan-unit-filter")).not.toBeInTheDocument()
    })
  })

  describe("Raids Plan Raided section", () => {
    it("moves exhausted Day-1 cells under a Raided divider after actionable ones, leaving later days alone", () => {
      useDailyRaids.mockReturnValue(
        raidedPlan([
          [battle, 0],
          [offPlanBattle, 3],
        ])
      )
      render(<SchedulePage />)

      const day1 = within(screen.getByTestId("plan-day-1"))
      const main = within(day1.getByTestId("plan-day-1-raids"))
      const raided = within(day1.getByTestId("plan-day-1-raided"))
      expect(main.getByTestId("plan-cell-1-B1")).toBeInTheDocument()
      expect(main.queryByTestId("plan-cell-1-U1")).not.toBeInTheDocument()
      expect(raided.getByTestId("plan-cell-1-U1")).toBeInTheDocument()
      expect(day1.getByTestId("plan-day-1-raided-divider")).toHaveTextContent(
        "plan.raided"
      )
      expect(
        day1
          .getByTestId("plan-day-1-raids")
          .compareDocumentPosition(day1.getByTestId("plan-day-1-raided"))
      ).toBe(Node.DOCUMENT_POSITION_FOLLOWING)

      // Same battle (B1) on Day 2 is not separated, and Day 2 gets no Raided section.
      expect(
        within(screen.getByTestId("plan-day-2")).getByTestId("plan-cell-2-U2")
      ).toBeInTheDocument()
      expect(screen.queryByTestId("plan-day-2-raided")).not.toBeInTheDocument()
    })

    it("keeps positive and unknown attempts actionable and shows no divider when nothing is raided", () => {
      // B1 has attempts left; B2 has no data at all (unknown, not exhausted).
      useDailyRaids.mockReturnValue(raidedPlan([[battle, 5]]))
      render(<SchedulePage />)

      const main = within(screen.getByTestId("plan-day-1-raids"))
      expect(main.getByTestId("plan-cell-1-U1")).toBeInTheDocument()
      expect(main.getByTestId("plan-cell-1-B1")).toBeInTheDocument()
      expect(
        screen.queryByTestId("plan-day-1-raided-divider")
      ).not.toBeInTheDocument()
      expect(screen.queryByTestId("plan-day-1-raided")).not.toBeInTheDocument()
    })

    it("moves cells between sections when refreshed attempt data changes", () => {
      useDailyRaids.mockReturnValue(raidedPlan([[battle, 3]]))
      const { rerender } = render(<SchedulePage />)
      expect(
        within(screen.getByTestId("plan-day-1-raids")).getByTestId(
          "plan-cell-1-U1"
        )
      ).toBeInTheDocument()

      useDailyRaids.mockReturnValue(raidedPlan([[battle, 0]]))
      rerender(<SchedulePage />)
      expect(
        within(screen.getByTestId("plan-day-1-raided")).getByTestId(
          "plan-cell-1-U1"
        )
      ).toBeInTheDocument()

      useDailyRaids.mockReturnValue(raidedPlan([[battle, 2]]))
      rerender(<SchedulePage />)
      expect(screen.queryByTestId("plan-day-1-raided")).not.toBeInTheDocument()
      expect(
        within(screen.getByTestId("plan-day-1-raids")).getByTestId(
          "plan-cell-1-U1"
        )
      ).toBeInTheDocument()
    })

    it("puts a future-day cell whose need is already met under Raided with a success badge", () => {
      const base = raidedPlan([])
      useDailyRaids.mockReturnValue({
        ...base,
        resourceProgressByDay: new Map(base.resourceProgressByDay).set(
          2,
          new Map([["g1:U2", { owned: 5, target: 5 }]])
        ),
      })
      render(<SchedulePage />)

      const day2 = within(screen.getByTestId("plan-day-2"))
      expect(day2.queryByTestId("plan-day-2-raids")).not.toBeInTheDocument()
      expect(
        within(day2.getByTestId("plan-day-2-raided")).getByTestId(
          "plan-cell-2-U2-progress"
        )
      ).toHaveClass("bg-success")
    })

    it("preserves plan totals and day summary across both sections", () => {
      useDailyRaids.mockReturnValue(
        raidedPlan([
          [battle, 0],
          [offPlanBattle, 3],
        ])
      )
      render(<SchedulePage />)

      const day1 = within(screen.getByTestId("plan-day-1"))
      expect(day1.getByText("12/288")).toBeInTheDocument()
      expect(screen.getByText("200")).toBeInTheDocument()
    })

    it("excludes raided-only units from the day's unit row", () => {
      useDailyRaids.mockReturnValue(raidedPlan([[battle, 0]]))
      render(<SchedulePage />)

      const units = within(screen.getByTestId("plan-day-1-units"))
      expect(units.getByRole("img", { name: "Aleph-Null" })).toBeInTheDocument()
      expect(
        units.queryByRole("img", { name: "Bellator" })
      ).not.toBeInTheDocument()
    })

    it("shows only the Raided section, without empty-plan wording, when every Day-1 cell is raided", () => {
      useDailyRaids.mockReturnValue(
        raidedPlan([
          [battle, 0],
          [offPlanBattle, 0],
        ])
      )
      render(<SchedulePage />)

      const day1 = within(screen.getByTestId("plan-day-1"))
      expect(day1.queryByTestId("plan-day-1-raids")).not.toBeInTheDocument()
      const raided = within(day1.getByTestId("plan-day-1-raided"))
      expect(raided.getByTestId("plan-cell-1-U1")).toBeInTheDocument()
      expect(raided.getByTestId("plan-cell-1-B1")).toBeInTheDocument()
      expect(day1.getByText("12/288")).toBeInTheDocument()
      expect(
        within(screen.getByTestId("plan-day-2")).getByTestId("plan-cell-2-U2")
      ).toBeInTheDocument()
    })
  })

  it("still renders Today when the plan completes during Day 1", () => {
    const state = ready()
    useDailyRaids.mockReturnValue(ready({ planDays: [state.today] }))
    render(<SchedulePage />)
    expect(screen.getByTestId("plan-day-1")).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "plan.showAll" })
    ).not.toBeInTheDocument()
  })
})

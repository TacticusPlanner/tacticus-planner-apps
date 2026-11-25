import { beforeEach, describe, expect, it, vi } from "vitest"

import { render, screen, waitFor } from "@/test/render"
import { seedGameCatalog } from "@/test/seed"

import { ProjectsWidget } from "./projects-widget"

const {
  isMobileRef,
  navigateMock,
  useHomeProjectsMock,
  planInsightsMock,
  deadlinesSeen,
} = vi.hoisted(() => ({
  isMobileRef: { current: false },
  navigateMock: vi.fn(),
  useHomeProjectsMock: vi.fn(),
  planInsightsMock: vi.fn(),
  deadlinesSeen: vi.fn(),
}))

// Pass-through that records each resolved deadline, so a test can wait for the resolved state.
vi.mock("@/entities/project", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/entities/project")>()
  return {
    ...actual,
    useProjectDeadlines: (
      ...args: Parameters<typeof actual.useProjectDeadlines>
    ) => {
      const deadlines = actual.useProjectDeadlines(...args)
      deadlinesSeen(deadlines)
      return deadlines
    },
  }
})

// One result object, as the real hook keeps its result in state between renders.
const planInsightsResult = {
  result: {
    estimates: new Map(),
    goalDates: new Map(),
    plannedGoalIds: [],
    onslaughtWaitDate: null,
  },
  loading: false,
  isError: false,
}
vi.mock("@/features/goal-planning/model/insights/use-plan-insights", () => ({
  usePlanInsights: (scope: unknown) => {
    planInsightsMock(scope)
    return planInsightsResult
  },
}))

vi.mock("react-i18next", () => {
  // One `t`, as the real hook's: the unit-name resolver behind the goal metrics memoises on it.
  const translation = {
    t: (key: string, values?: Record<string, unknown>) =>
      values ? `${key}:${JSON.stringify(values)}` : key,
    i18n: { language: "en" },
  }
  return {
    initReactI18next: { type: "3rdParty", init: vi.fn() },
    useTranslation: () => translation,
  }
})
vi.mock("react-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-router")>()),
  useNavigate: () => navigateMock,
}))
vi.mock("@workspace/ui/hooks/use-mobile", () => ({
  useIsMobile: () => isMobileRef.current,
}))
vi.mock("@/features/project-management", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/features/project-management")>()
  return {
    ...actual,
    useHomeProjects: (limit: number | null) => useHomeProjectsMock(limit),
  }
})

function project(overrides: Record<string, unknown> = {}) {
  return {
    projectId: "p1",
    name: "Project",
    color: null,
    description: null,
    status: "Active",
    isDefault: false,
    revision: 1,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  }
}

describe("ProjectsWidget", () => {
  beforeEach(() => {
    isMobileRef.current = false
  })

  it("reads every project, so Show more needs no other read", () => {
    isMobileRef.current = true
    useHomeProjectsMock.mockReturnValue({ status: "loading" })

    render(<ProjectsWidget />, { route: "/" })

    expect(useHomeProjectsMock).toHaveBeenCalledWith(null)
  })

  it("shows a loading state", () => {
    useHomeProjectsMock.mockReturnValue({ status: "loading" })

    render(<ProjectsWidget />, { route: "/" })

    expect(screen.getByTestId("home-projects-loading")).toBeInTheDocument()
  })

  it("shows an error state with retry", () => {
    const retry = vi.fn()
    useHomeProjectsMock.mockReturnValue({ status: "error", retry })

    render(<ProjectsWidget />, { route: "/" })

    expect(screen.getByTestId("home-projects-error")).toBeInTheDocument()
  })

  it("shows an empty state with a create-project action", () => {
    useHomeProjectsMock.mockReturnValue({ status: "empty" })

    render(<ProjectsWidget />, { route: "/" })

    expect(screen.getByTestId("home-projects-empty")).toBeInTheDocument()
  })

  it("renders project rows and opens a project on the Goals page on activation", async () => {
    useHomeProjectsMock.mockReturnValue({
      status: "ready",
      projects: [project({ projectId: "p1", isDefault: true })],
      summaries: new Map([["p1", { status: "success", units: 2, goals: 3 }]]),
      remainingCount: 0,
    })

    render(<ProjectsWidget />, { route: "/" })

    screen.getByTestId("home-project-row-p1").click()
    expect(navigateMock).toHaveBeenCalledWith("/plan/goals?project=p1")
    expect(screen.queryByTestId("home-projects-more")).not.toBeInTheDocument()
  })

  it("shows the card's unit portraits at the inline icon size with +N", () => {
    useHomeProjectsMock.mockReturnValue({
      status: "ready",
      projects: [project({ projectId: "p1" })],
      summaries: new Map([
        [
          "p1",
          {
            status: "success",
            units: 6,
            goals: 8,
            portraitUnits: ["a", "b", "c", "d"].map((entityId) => ({
              entityType: "Character",
              entityId,
            })),
          },
        ],
      ]),
      remainingCount: 0,
    })

    render(<ProjectsWidget />, { route: "/" })

    const portraits = screen.getByTestId("project-unit-portraits")
    const images = portraits.querySelectorAll("img")
    expect(images).toHaveLength(4)
    expect(images[0]).toHaveClass("size-icon")
    expect(portraits).toHaveTextContent("+2")
  })

  it.each([
    [false, 5],
    [true, 3],
  ])(
    "shows Home's card count (mobile %s: %i) of projects, then Show N more expands them in place",
    async (isMobile, limit) => {
      isMobileRef.current = isMobile
      const projects = Array.from({ length: 7 }, (_, index) =>
        project({ projectId: `p${index}`, name: `Project ${index}` })
      )
      useHomeProjectsMock.mockReturnValue({
        status: "ready",
        projects,
        summaries: new Map(),
        remainingCount: 0,
      })

      render(<ProjectsWidget />, { route: "/" })
      const rows = () => screen.getAllByTestId(/^home-project-row-/)
      await waitFor(() => expect(rows()).toHaveLength(limit))

      const more = screen.getByTestId("home-projects-more")
      expect(more).toHaveTextContent(
        `home.projects.showMore:{"count":${7 - limit}}`
      )
      more.click()

      await waitFor(() => expect(rows()).toHaveLength(7))
      expect(more).toHaveTextContent("home.projects.showLess")
      expect(navigateMock).not.toHaveBeenCalled()
    }
  )

  it("links to all projects from the header", () => {
    useHomeProjectsMock.mockReturnValue({ status: "loading" })

    render(<ProjectsWidget />, { route: "/" })

    expect(screen.getByTestId("home-projects-all")).toHaveAttribute(
      "href",
      "/plan/projects"
    )
  })

  describe("deadline fit counts", () => {
    const ready = (projects: ReturnType<typeof project>[]) => ({
      status: "ready",
      projects,
      summaries: new Map(),
      remainingCount: 0,
    })

    it("runs the plan for Done by when a project holds a goal, target or not", async () => {
      planInsightsMock.mockClear()
      useHomeProjectsMock.mockReturnValue(
        ready([project({ target: null, goalIds: ["g1"] })])
      )
      render(<ProjectsWidget />, { route: "/" })
      await waitFor(() => expect(planInsightsMock).toHaveBeenCalled())
      expect(planInsightsMock).toHaveBeenLastCalledWith(null)
    })

    it("runs no plan when no listed project holds a goal", async () => {
      planInsightsMock.mockClear()
      useHomeProjectsMock.mockReturnValue(
        ready([project({ target: null, goalIds: [] })])
      )
      render(<ProjectsWidget />, { route: "/" })
      // The fit counts load in their own lazy chunk.
      await waitFor(() => expect(planInsightsMock).toHaveBeenCalled())
      for (const [scope] of planInsightsMock.mock.calls) {
        expect(scope).toEqual([])
      }
    })

    describe("with a targeted project", () => {
      // Uthar's run 3 starts well after now, so its deadline resolves ready and not ended.
      beforeEach(async () => {
        await seedGameCatalog({
          lres: [
            {
              id: "votanUthar",
              name: "Uthar",
              eventStageStartDatesUtc: [
                "2026-03-08T00:00:00Z",
                "2026-10-04T00:00:00Z",
                "2099-11-27T00:00:00Z",
              ],
            },
          ],
        })
        planInsightsMock.mockClear()
        deadlinesSeen.mockClear()
      })

      const resolvedStatus = () => {
        const deadlines = deadlinesSeen.mock.lastCall?.[0] as
          ReadonlyMap<string, { status: string }> | undefined
        return deadlines?.get("p1")?.status
      }

      const targeted = (eventId: string, goalIds = ["g1"]) =>
        ready([
          project({
            target: { kind: "legendaryEvent", eventId },
            goalIds,
          }),
        ])

      it("runs the full plan once its deadline resolves", async () => {
        useHomeProjectsMock.mockReturnValue(targeted("votanUthar"))
        render(<ProjectsWidget />, { route: "/" })
        // Loading also runs the plan, so check the call made once the deadline is ready.
        await waitFor(() => expect(resolvedStatus()).toBe("ready"))
        expect(planInsightsMock).toHaveBeenLastCalledWith(null)
      })

      it("skips the plan when the targeted project holds no goal", async () => {
        useHomeProjectsMock.mockReturnValue(targeted("votanUthar", []))
        render(<ProjectsWidget />, { route: "/" })
        await waitFor(() => expect(resolvedStatus()).toBe("ready"))
        expect(planInsightsMock).toHaveBeenLastCalledWith([])
      })

      it("shows the deadline chip with its countdown", async () => {
        useHomeProjectsMock.mockReturnValue(targeted("votanUthar"))
        render(<ProjectsWidget />, { route: "/" })
        await waitFor(() =>
          expect(screen.getByTestId("home-project-target")).toHaveAttribute(
            "data-state-timing",
            "upcoming"
          )
        )
      })
    })
  })
})

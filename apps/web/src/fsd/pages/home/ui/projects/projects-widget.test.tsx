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

vi.mock("@/features/goal-planning/model/insights/use-plan-insights", () => ({
  usePlanInsights: (scope: unknown) => {
    planInsightsMock(scope)
    return {
      result: { estimates: new Map() },
      loading: false,
      isError: false,
    }
  },
}))

vi.mock("react-i18next", () => ({
  initReactI18next: { type: "3rdParty", init: vi.fn() },
  useTranslation: () => ({
    t: (key: string, values?: Record<string, unknown>) =>
      values ? `${key}:${JSON.stringify(values)}` : key,
    i18n: { language: "en" },
  }),
}))
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

  it("requests an uncapped project list on desktop", () => {
    useHomeProjectsMock.mockReturnValue({ status: "loading" })

    render(<ProjectsWidget />, { route: "/" })

    expect(useHomeProjectsMock).toHaveBeenCalledWith(null)
  })

  it("requests a capped (3) project list on mobile", () => {
    isMobileRef.current = true
    useHomeProjectsMock.mockReturnValue({ status: "loading" })

    render(<ProjectsWidget />, { route: "/" })

    expect(useHomeProjectsMock).toHaveBeenCalledWith(3)
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

  it("shows the card's unit portraits at the widget size with +N", () => {
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
    expect(images[0]).toHaveClass("size-5")
    expect(portraits).toHaveTextContent("+2")
  })

  it("shows a +N more control that navigates to the projects dashboard", () => {
    useHomeProjectsMock.mockReturnValue({
      status: "ready",
      projects: [project({ projectId: "p1" })],
      summaries: new Map(),
      remainingCount: 2,
    })

    render(<ProjectsWidget />, { route: "/" })

    screen.getByTestId("home-projects-more").click()
    expect(navigateMock).toHaveBeenCalledWith("/plan/projects")
  })

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

    it("runs no plan when no listed project has a target", async () => {
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

      const targeted = (eventId: string) =>
        ready([
          project({
            target: { kind: "legendaryEvent", eventId },
            goalIds: [],
          }),
        ])

      it("runs the full plan once its deadline resolves", async () => {
        useHomeProjectsMock.mockReturnValue(targeted("votanUthar"))
        render(<ProjectsWidget />, { route: "/" })
        // Loading also runs the plan, so check the call made once the deadline is ready.
        await waitFor(() => expect(resolvedStatus()).toBe("ready"))
        expect(planInsightsMock).toHaveBeenLastCalledWith(null)
      })

      it("skips the plan once the deadline turns out unavailable", async () => {
        useHomeProjectsMock.mockReturnValue(targeted("gone"))
        render(<ProjectsWidget />, { route: "/" })
        await waitFor(() => expect(resolvedStatus()).toBe("unavailable"))
        expect(planInsightsMock).toHaveBeenLastCalledWith([])
      })
    })
  })
})

import { beforeEach, describe, expect, it, vi } from "vitest"

import { render, screen } from "@/test/render"

import { OverviewProjectQuicknav } from "./overview-project-quicknav"

const { isMobileRef, navigateMock, useHomeProjectsMock } = vi.hoisted(() => ({
  isMobileRef: { current: false },
  navigateMock: vi.fn(),
  useHomeProjectsMock: vi.fn(),
}))

vi.mock("react-i18next", () => ({
  initReactI18next: { type: "3rdParty", init: vi.fn() },
  useTranslation: () => ({
    t: (key: string, values?: Record<string, unknown>) =>
      values ? `${key}:${JSON.stringify(values)}` : key,
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
    isActivePlan: false,
    isDefault: false,
    revision: 1,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  } as never
}

const defaultProps = {
  projects: [],
  projectsFailed: false,
  projectsLoading: false,
}

describe("OverviewProjectQuicknav", () => {
  beforeEach(() => {
    isMobileRef.current = false
    navigateMock.mockReset()
    useHomeProjectsMock.mockReset()
  })

  describe("mobile", () => {
    beforeEach(() => {
      isMobileRef.current = true
    })

    it("requests a capped (3) project list", () => {
      useHomeProjectsMock.mockReturnValue({ status: "loading" })
      render(<OverviewProjectQuicknav {...defaultProps} />)
      expect(useHomeProjectsMock).toHaveBeenCalledWith(3)
    })

    it("shows a loading state", () => {
      useHomeProjectsMock.mockReturnValue({ status: "loading" })
      render(<OverviewProjectQuicknav {...defaultProps} />)
      expect(
        screen.getByTestId("overview-quicknav-loading")
      ).toBeInTheDocument()
    })

    it("shows an error state with retry", () => {
      useHomeProjectsMock.mockReturnValue({ status: "error", retry: vi.fn() })
      render(<OverviewProjectQuicknav {...defaultProps} />)
      expect(screen.getByTestId("overview-quicknav-error")).toBeInTheDocument()
    })

    it("shows the same empty-state teaching as the home widget", () => {
      useHomeProjectsMock.mockReturnValue({ status: "empty" })
      render(<OverviewProjectQuicknav {...defaultProps} />)
      expect(screen.getByTestId("overview-quicknav-empty")).toBeInTheDocument()
      expect(screen.getByText("home.projects.emptyTitle")).toBeInTheDocument()
    })

    it("renders project rows and navigates to a project's detail route on activation", () => {
      useHomeProjectsMock.mockReturnValue({
        status: "ready",
        projects: [project({ projectId: "p1", isActivePlan: true })],
        summaries: new Map([["p1", { status: "success", units: 2, goals: 3 }]]),
        remainingCount: 0,
      })
      render(<OverviewProjectQuicknav {...defaultProps} />)
      screen.getByTestId("home-project-row-p1").click()
      expect(navigateMock).toHaveBeenCalledWith("/goals/projects/p1")
    })

    it("shows a +N more control that navigates to the projects dashboard", () => {
      useHomeProjectsMock.mockReturnValue({
        status: "ready",
        projects: [project({ projectId: "p1" })],
        summaries: new Map(),
        remainingCount: 2,
      })
      render(<OverviewProjectQuicknav {...defaultProps} />)
      screen.getByTestId("overview-quicknav-more").click()
      expect(navigateMock).toHaveBeenCalledWith("/goals/projects")
    })
  })

  describe("desktop", () => {
    it("does not request the capped home-projects summary hook", () => {
      render(<OverviewProjectQuicknav {...defaultProps} />)
      expect(useHomeProjectsMock).not.toHaveBeenCalled()
    })

    it("shows a loading skeleton", () => {
      render(<OverviewProjectQuicknav {...defaultProps} projectsLoading />)
      expect(
        screen.getByTestId("overview-quicknav-loading")
      ).toBeInTheDocument()
    })

    it("renders nothing on failure", () => {
      const { container } = render(
        <OverviewProjectQuicknav {...defaultProps} projectsFailed />
      )
      expect(container).toBeEmptyDOMElement()
    })

    it("renders nothing when there are no projects", () => {
      render(<OverviewProjectQuicknav {...defaultProps} />)
      expect(
        screen.queryByTestId("overview-quicknav-desktop")
      ).not.toBeInTheDocument()
    })

    it("lists every non-archived project, Current plan first, excluding archived", () => {
      render(
        <OverviewProjectQuicknav
          {...defaultProps}
          projects={[
            project({ projectId: "p2" }),
            project({ projectId: "p1", isActivePlan: true }),
            project({ projectId: "p3", status: "Archived" }),
          ]}
        />
      )
      const nav = screen.getByTestId("overview-quicknav-desktop")
      expect(nav).toHaveAccessibleName("goals.project.quicknavLabel")
      expect(
        screen.getByTestId("overview-quicknav-chip-p1")
      ).toBeInTheDocument()
      expect(
        screen.getByTestId("overview-quicknav-chip-p2")
      ).toBeInTheDocument()
      expect(
        screen.queryByTestId("overview-quicknav-chip-p3")
      ).not.toBeInTheDocument()
    })

    it("navigates to a project's detail route when a chip is activated", () => {
      render(
        <OverviewProjectQuicknav
          {...defaultProps}
          projects={[project({ projectId: "p1" })]}
        />
      )
      screen.getByTestId("overview-quicknav-chip-p1").click()
      expect(navigateMock).toHaveBeenCalledWith("/goals/projects/p1")
    })

    it("includes a trailing link to the full Projects dashboard", () => {
      render(
        <OverviewProjectQuicknav
          {...defaultProps}
          projects={[project({ projectId: "p1" })]}
        />
      )
      screen.getByTestId("overview-quicknav-all-projects").click()
      expect(navigateMock).toHaveBeenCalledWith("/goals/projects")
    })
  })
})

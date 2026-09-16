import { describe, expect, it, vi } from "vitest"

import { render, screen } from "@/test/render"

import { ProjectsWidget } from "./projects-widget"

const { navigateMock, useHomeProjectsMock } = vi.hoisted(() => ({
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
vi.mock("@/features/project-management", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/features/project-management")>()
  return { ...actual, useHomeProjects: () => useHomeProjectsMock() }
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
  }
}

describe("ProjectsWidget", () => {
  it("shows a loading state", () => {
    useHomeProjectsMock.mockReturnValue({ status: "loading" })

    render(<ProjectsWidget />)

    expect(screen.getByTestId("home-projects-loading")).toBeInTheDocument()
  })

  it("shows an error state with retry", () => {
    const retry = vi.fn()
    useHomeProjectsMock.mockReturnValue({ status: "error", retry })

    render(<ProjectsWidget />)

    expect(screen.getByTestId("home-projects-error")).toBeInTheDocument()
  })

  it("shows an empty state with a create-project action", () => {
    useHomeProjectsMock.mockReturnValue({ status: "empty" })

    render(<ProjectsWidget />)

    expect(screen.getByTestId("home-projects-empty")).toBeInTheDocument()
  })

  it("renders project rows and navigates to a project's detail route on activation", async () => {
    useHomeProjectsMock.mockReturnValue({
      status: "ready",
      projects: [project({ projectId: "p1", isActivePlan: true })],
      summaries: new Map([["p1", { status: "success", units: 2, goals: 3 }]]),
      remainingCount: 0,
    })

    render(<ProjectsWidget />)

    screen.getByTestId("home-project-row-p1").click()
    expect(navigateMock).toHaveBeenCalledWith("/goals/projects/p1")
    expect(screen.queryByTestId("home-projects-more")).not.toBeInTheDocument()
  })

  it("shows a +N more control that navigates to the projects dashboard", () => {
    useHomeProjectsMock.mockReturnValue({
      status: "ready",
      projects: [project({ projectId: "p1" })],
      summaries: new Map(),
      remainingCount: 2,
    })

    render(<ProjectsWidget />)

    screen.getByTestId("home-projects-more").click()
    expect(navigateMock).toHaveBeenCalledWith("/goals/projects")
  })
})

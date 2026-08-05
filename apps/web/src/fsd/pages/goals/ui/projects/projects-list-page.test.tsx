import { beforeEach, describe, expect, it, vi } from "vitest"
import { MemoryRouter, Route, Routes } from "react-router"
import { useQuery } from "@tanstack/react-query"
import { useIsAuthenticated } from "@azure/msal-react"
import { render, screen } from "@/test/render"
import userEvent from "@testing-library/user-event"

vi.mock("@/shared/tour", () => ({
  useTourPageSteps: () => undefined,
}))

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string }) =>
      opts?.defaultValue ?? key,
  }),
}))

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

const account = { homeAccountId: "acc-1", username: "test@example.com" }

vi.mock("@azure/msal-react", () => ({
  useMsal: () => ({
    accounts: [account],
    instance: { getActiveAccount: () => account },
  }),
  useIsAuthenticated: () => true,
}))

const listProjects = vi.fn()

type MockProjectSummary = {
  projectId: string
  isActivePlan: boolean
  isDefault: boolean
  [key: string]: unknown
}

vi.mock("@/entities/project", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/entities/project")>()
  return {
    ...actual,
    listProjects: (...args: unknown[]) => listProjects(...args),
    projectQueries: {
      all: () => ["projects"],
      list: () => ({
        queryKey: ["projects", "list"],
        queryFn: () => listProjects(),
      }),
    },
    // `useProjects` lives inside the mocked `@/entities/project` package and imports
    // `projectQueries` from its own barrel, so it doesn't see this factory's override above
    // (a Vitest self-reference quirk with `importOriginal`) - reimplemented here directly
    // against the mocked `listProjects`, mirroring `use-projects.ts`'s real shape.
    useProjects: () => {
      const isAuthenticated = useIsAuthenticated()
      const query = useQuery({
        queryKey: ["projects", "list"],
        queryFn: () => listProjects(),
        enabled: isAuthenticated,
      })
      const projects =
        (query.data as { projects: MockProjectSummary[] } | undefined)
          ?.projects ?? []
      const activeProject = projects.find((project) => project.isActivePlan)
      const defaultProject = projects.find((project) => project.isDefault)
      return {
        fetchState: query.isError
          ? { status: "error" as const, message: "error" }
          : query.data
            ? { status: "success" as const, projects }
            : { status: "idle" as const },
        projects,
        activeProjectId: activeProject?.projectId,
        defaultProjectId: defaultProject?.projectId,
        loading: isAuthenticated && query.isPending,
        retry: () => {
          void query.refetch()
        },
      }
    },
  }
})

vi.mock("@/entities/goal", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/goal")>()),
  goalQueries: {
    all: () => ["goals"],
    list: () => ({
      queryKey: ["goals", "list"],
      queryFn: () => Promise.resolve({ goals: [] }),
    }),
  },
}))

vi.mock("@/shared/api", () => ({ ApiError: class ApiError extends Error {} }))

import { ProjectsListPage } from "./projects-list-page"

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/goals/projects"]}>
      <Routes>
        <Route path="/goals/projects" element={<ProjectsListPage />} />
        <Route
          path="/goals/projects/:projectId"
          element={<div data-testid="landed-on-detail" />}
        />
      </Routes>
    </MemoryRouter>
  )
}

function project(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    projectId: "proj-1",
    name: "Project A",
    description: null,
    color: null,
    status: "Active",
    isActivePlan: true,
    isDefault: true,
    revision: 0,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  }
}

describe("ProjectsListPage", () => {
  beforeEach(() => {
    listProjects.mockReset()
  })

  it("shows only the New project affordance (FAB) when there are no projects yet", async () => {
    listProjects.mockResolvedValue({ projects: [] })
    renderPage()

    expect(await screen.findByTestId("projects-page-empty")).toBeInTheDocument()
    expect(screen.getByTestId("projects-new-project")).toBeInTheDocument()
    expect(screen.queryByTestId("project-list")).not.toBeInTheDocument()
  })

  it("lists every project, including archived ones, with no page heading", async () => {
    const projectA = project()
    const archived = project({
      projectId: "proj-archived",
      name: "Old plan",
      isActivePlan: false,
      isDefault: false,
      status: "Archived",
    })
    listProjects.mockResolvedValue({ projects: [projectA, archived] })
    renderPage()

    expect(await screen.findByText("Project A")).toBeInTheDocument()
    expect(screen.getByText("Old plan")).toBeInTheDocument()
    expect(
      screen.queryByRole("heading", { name: /goals\.project\.listTitle/ })
    ).not.toBeInTheDocument()
  })

  it("opens a blank Sheet from the FAB and a pre-filled Sheet from a row's Edit icon", async () => {
    const projectA = project()
    listProjects.mockResolvedValue({ projects: [projectA] })
    const user = userEvent.setup()
    renderPage()

    await screen.findByText("Project A")
    await user.click(screen.getByTestId("projects-new-project"))
    expect(
      await screen.findByText("goals.project.newProjectTitle")
    ).toBeInTheDocument()
    expect(screen.getByLabelText("goals.project.name")).toHaveValue("")
    await user.keyboard("{Escape}")

    await user.click(
      screen.getByTestId(`project-row-edit-${projectA.projectId}`)
    )
    expect(
      await screen.findByText("goals.project.editTitle")
    ).toBeInTheDocument()
    expect(screen.getByLabelText("goals.project.name")).toHaveValue("Project A")
  })

  it("navigates to the project's detail route when a row is clicked outside its icons", async () => {
    const projectA = project()
    listProjects.mockResolvedValue({ projects: [projectA] })
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByText("Project A"))
    expect(await screen.findByTestId("landed-on-detail")).toBeInTheDocument()
  })

  it("does not navigate when a row's action icon is clicked", async () => {
    const projectA = project()
    listProjects.mockResolvedValue({ projects: [projectA] })
    const user = userEvent.setup()
    renderPage()

    await screen.findByText("Project A")
    await user.click(
      screen.getByTestId(`project-row-edit-${projectA.projectId}`)
    )
    expect(screen.queryByTestId("landed-on-detail")).not.toBeInTheDocument()
    expect(screen.getByTestId("projects-page")).toBeInTheDocument()
  })
})

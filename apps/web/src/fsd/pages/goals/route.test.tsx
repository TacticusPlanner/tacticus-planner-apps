import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router"

const { useProjectsMock } = vi.hoisted(() => ({
  useProjectsMock: vi.fn(),
}))

vi.mock("@/entities/project", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/entities/project")>()
  return {
    ...actual,
    useProjects: () => useProjectsMock(),
  }
})

import { routes } from "./route"

// Only the index route's element is exercised here - the other routes lazy-load real pages, so
// their elements are swapped for stubs to keep this test focused on the index route's own
// resolution (plan-nav-default-landing).
function renderGoalsRoutes() {
  render(
    <MemoryRouter initialEntries={["/goals"]}>
      <Routes>
        <Route path="/goals">
          {routes.map((route) =>
            route.index ? (
              <Route index element={route.element} key="index" />
            ) : (
              <Route
                element={<div data-testid={`${route.path}-child`} />}
                key={route.path}
                path={route.path}
              />
            )
          )}
        </Route>
      </Routes>
    </MemoryRouter>
  )
}

describe("goals routes", () => {
  it("redirects /goals to Current plan's project detail route", () => {
    useProjectsMock.mockReturnValue({
      activeProjectId: "p1",
      defaultProjectId: "p2",
      loading: false,
    })

    renderGoalsRoutes()

    expect(screen.getByTestId("projects/:projectId-child")).toBeInTheDocument()
  })

  it("falls back to the Default project when there is no Current plan", () => {
    useProjectsMock.mockReturnValue({
      activeProjectId: undefined,
      defaultProjectId: "p2",
      loading: false,
    })

    renderGoalsRoutes()

    expect(screen.getByTestId("projects/:projectId-child")).toBeInTheDocument()
  })

  it("falls back to All Goals when the account has no projects", () => {
    useProjectsMock.mockReturnValue({
      activeProjectId: undefined,
      defaultProjectId: undefined,
      loading: false,
    })

    renderGoalsRoutes()

    expect(screen.getByTestId("overview-child")).toBeInTheDocument()
  })

  it("shows a loading state instead of redirecting while the project list is still loading", () => {
    useProjectsMock.mockReturnValue({
      activeProjectId: undefined,
      defaultProjectId: undefined,
      loading: true,
    })

    renderGoalsRoutes()

    expect(
      screen.getByTestId("default-goals-landing-loading")
    ).toBeInTheDocument()
    expect(screen.queryByTestId("overview-child")).not.toBeInTheDocument()
  })
})

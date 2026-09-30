import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router"

import { routes } from "./route"

// Only the index route's own resolution is exercised: the other routes lazy-load real pages, so
// their elements are swapped for stubs.
function renderPlanRoutes(initialPath: string) {
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/plan">
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

describe("plan routes", () => {
  it("serves no per-project detail route", () => {
    expect(routes.some((route) => route.path?.startsWith("projects/"))).toBe(
      false
    )
    renderPlanRoutes("/plan/projects/p1")
    expect(screen.queryByTestId("projects-child")).not.toBeInTheDocument()
  })

  it("lands the bare /plan on Goals whatever the account's projects are", () => {
    renderPlanRoutes("/plan")

    expect(screen.getByTestId("goals-child")).toBeInTheDocument()
  })

  it.each([
    ["/plan/goals", "goals-child"],
    ["/plan/projects", "projects-child"],
    ["/plan/insights", "insights-child"],
    ["/plan/schedule", "schedule-child"],
  ])("routes %s to its page", (path, testId) => {
    renderPlanRoutes(path)

    expect(screen.getByTestId(testId)).toBeInTheDocument()
  })
})

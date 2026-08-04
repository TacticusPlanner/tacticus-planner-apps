import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router"

import { routes } from "./route"

// Only the index route's `<Navigate>` element is exercised here - the other routes lazy-load real
// pages, so their elements are swapped for stubs to keep this test focused on the redirect.
describe("goals routes", () => {
  it("redirects /goals to /goals/overview using the exported route config", () => {
    render(
      <MemoryRouter initialEntries={["/goals"]}>
        <Routes>
          <Route path="/goals">
            {routes.map((route) =>
              route.index ? (
                <Route index element={route.element} key="index" />
              ) : (
                <Route
                  element={
                    route.path === "overview" ? (
                      <div data-testid="overview-child" />
                    ) : (
                      <div data-testid={`${route.path}-child`} />
                    )
                  }
                  key={route.path}
                  path={route.path}
                />
              )
            )}
          </Route>
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByTestId("overview-child")).toBeInTheDocument()
  })
})

import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes, useLocation } from "react-router"

import { routes } from "./route"

function LocationProbe() {
  const { pathname } = useLocation()
  return <span data-testid="current-path">{pathname}</span>
}

// The routes lazy-load real pages, so their elements are swapped for stubs; the surrounding tree
// mirrors app/routes.tsx (the section mount and the "*" not-found redirect).
function renderLegendaryEventsRoutes(entries: string[]) {
  render(
    <MemoryRouter initialEntries={entries} initialIndex={entries.length - 1}>
      <LocationProbe />
      <Routes>
        <Route element={<div data-testid="home" />} path="/home" />
        <Route path="/legendary-events">
          {routes.map((route) =>
            route.index ? (
              <Route element={<div data-testid="hub" />} index key="index" />
            ) : (
              <Route
                element={<div data-testid="event-page" />}
                key={route.path}
                path={route.path}
              />
            )
          )}
        </Route>
        <Route element={<div data-testid="not-found" />} path="*" />
      </Routes>
    </MemoryRouter>
  )
}

describe("legendary events routes", () => {
  it("routes the hub at the section root", () => {
    renderLegendaryEventsRoutes(["/legendary-events"])
    expect(screen.getByTestId("hub")).toBeInTheDocument()
  })

  it("routes an event page by id", () => {
    renderLegendaryEventsRoutes(["/legendary-events/astarLysander"])
    expect(screen.getByTestId("event-page")).toBeInTheDocument()
  })

  it("leaves the old /events paths to the not-found route", () => {
    renderLegendaryEventsRoutes(["/events/legendary-events"])
    expect(screen.getByTestId("not-found")).toBeInTheDocument()
    expect(screen.queryByTestId("hub")).toBeNull()
  })
})

import { describe, expect, it } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router"

import { routes } from "./route"

function LocationProbe() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  return (
    <>
      <span data-testid="current-path">{pathname}</span>
      <button
        data-testid="go-back"
        onClick={() => void navigate(-1)}
        type="button"
      >
        back
      </button>
    </>
  )
}

// The index route's own redirect is exercised as-is; the other routes lazy-load real pages, so
// their elements are swapped for stubs.
function renderEventsRoutes(entries: string[]) {
  render(
    <MemoryRouter initialEntries={entries} initialIndex={entries.length - 1}>
      <LocationProbe />
      <Routes>
        <Route element={<div data-testid="home" />} path="/home" />
        <Route path="/events">
          {routes.map((route) =>
            route.index ? (
              <Route element={route.element} index key="index" />
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

describe("events routes", () => {
  it("redirects /events to the hub, replacing the history entry", () => {
    renderEventsRoutes(["/home", "/events"])

    expect(screen.getByTestId("current-path")).toHaveTextContent(
      /^\/events\/legendary-events$/
    )
    expect(screen.getByTestId("legendary-events-child")).toBeInTheDocument()

    // Replaced, not pushed: Back leaves the section instead of landing on /events again.
    fireEvent.click(screen.getByTestId("go-back"))
    expect(screen.getByTestId("current-path")).toHaveTextContent(/^\/home$/)
  })

  it("routes the hub and an event page", () => {
    renderEventsRoutes(["/events/legendary-events"])
    expect(screen.getByTestId("legendary-events-child")).toBeInTheDocument()
  })

  it("routes an event page by id", () => {
    renderEventsRoutes(["/events/legendary-events/astarLysander"])
    expect(
      screen.getByTestId("legendary-events/:eventId-child")
    ).toBeInTheDocument()
  })
})

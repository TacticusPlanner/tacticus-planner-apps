import type { ReactNode } from "react"
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
  type RouteObject,
} from "react-router"
import { describe, expect, it, vi } from "vitest"

import { InteractionStatus } from "@azure/msal-browser"

import { render, screen } from "@/test/render"

vi.mock("@azure/msal-react", () => ({
  useIsAuthenticated: () => false,
  useMsal: () => ({ inProgress: InteractionStatus.None }),
}))

import { routes } from "./routes"

function findRoute(tree: RouteObject[], path: string): RouteObject | undefined {
  for (const route of tree) {
    if (route.path === path) return route
    const nested = route.children && findRoute(route.children, path)
    if (nested) return nested
  }
  return undefined
}

function Probe() {
  const { pathname, search } = useLocation()
  return <div data-testid="probe">{`${pathname}${search}`}</div>
}

function renderSection(path: string, element: ReactNode, entry: string) {
  render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route element={<Probe />} path="/" />
        <Route element={element} path={`${path}/*`} />
      </Routes>
    </MemoryRouter>
  )
}

describe("app routes", () => {
  it("registers /events with the Events section routes as children", () => {
    const events = findRoute(routes, "/events")
    expect(events?.children?.map((child) => child.path ?? "index")).toEqual([
      "index",
      "legendary-events",
      "legendary-events/:eventId",
    ])
  })

  it.each([
    ["/plan", "/plan/goals"],
    ["/events", "/events/legendary-events/astarLysander"],
  ])("bounces an anonymous visitor from %s to sign-in", (path, entry) => {
    renderSection(path, findRoute(routes, path)?.element, entry)

    expect(screen.getByTestId("probe")).toHaveTextContent(
      `/?next=${encodeURIComponent(entry)}`
    )
  })
})

import { MemoryRouter } from "react-router"
import { describe, expect, it } from "vitest"

import { render, screen } from "@/test/render"

import { RouteLoadingFill } from "./route-loading-fill"

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <RouteLoadingFill />
    </MemoryRouter>
  )
}

describe("RouteLoadingFill", () => {
  it("shows Home's skeleton while the Home page loads", () => {
    renderAt("/home")

    expect(screen.getByTestId("home-skeleton")).toBeVisible()
    expect(screen.getByRole("status", { name: "Loading…" })).toBeVisible()
  })

  it.each([
    "/legendary-events/ev-1",
    "/legendary-events/ev-1/teams",
    "/legendary-events/ev-1/plan",
  ])("shows the event page's skeleton while %s loads", (path) => {
    renderAt(path)

    expect(screen.getByTestId("legendary-event-skeleton")).toBeVisible()
    expect(screen.getByRole("status", { name: "Loading…" })).toBeVisible()
  })

  it.each(["/plan/goals", "/plan/projects"])(
    "shows Plan's list skeleton while %s loads",
    (path) => {
      renderAt(path)

      expect(screen.getByTestId("plan-skeleton")).toBeVisible()
    }
  )

  it.each([
    "/legendary-events/master-table",
    "/legendary-events/ev-1/plan/edit",
    "/plan/insights",
  ])("keeps the spinner for %s", (path) => {
    renderAt(path)

    expect(screen.queryByTestId("legendary-event-skeleton")).toBeNull()
    expect(screen.queryByTestId("plan-skeleton")).toBeNull()
    expect(screen.getByRole("status", { name: "Loading…" })).toBeVisible()
  })

  it("keeps the spinner for other pages", () => {
    renderAt("/settings")

    expect(screen.queryByTestId("home-skeleton")).not.toBeInTheDocument()
    expect(screen.getByRole("status", { name: "Loading…" })).toBeVisible()
  })
})

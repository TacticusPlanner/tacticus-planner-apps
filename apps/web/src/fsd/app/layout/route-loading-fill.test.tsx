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

  it("keeps the spinner for other pages", () => {
    renderAt("/plan/goals")

    expect(screen.queryByTestId("home-skeleton")).not.toBeInTheDocument()
    expect(screen.getByRole("status", { name: "Loading…" })).toBeVisible()
  })
})

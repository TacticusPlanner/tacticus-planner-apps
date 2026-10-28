import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { HomePage } from "./home-page"

vi.mock("@/shared/tour", () => ({ useAutoStartTourOnce: () => undefined }))
vi.mock("./home-page.tutorial", () => ({
  useHomePageTutorial: () => undefined,
}))
vi.mock("../model/use-home-events", () => ({
  useHomeEvents: () => ({ status: "loading" }),
}))
vi.mock("./right-now/right-now", () => ({
  RightNow: () => <div data-testid="home-right-now" />,
}))
vi.mock("./events/upcoming-events", () => ({
  UpcomingEvents: () => <div data-testid="home-events-widget" />,
}))
vi.mock("./projects/projects-widget", () => ({
  ProjectsWidget: () => <div data-testid="home-projects-widget" />,
}))
vi.mock("./raids/raids-widget", () => ({
  RaidsWidget: () => <div data-testid="home-raids-widget" />,
}))
vi.mock("./events-calendar/events-calendar", () => ({
  EventsCalendar: () => <div data-testid="events-calendar" />,
}))

describe("HomePage layout", () => {
  it("uses the shared page container, so it gets the same padding as other pages", () => {
    render(<HomePage />)
    const page = screen.getByTestId("home-page")

    expect(page.tagName).toBe("MAIN")
    expect(page).toHaveClass("p-4", "sm:p-6")
  })

  it("orders Right now, then the widgets row, then the calendar", () => {
    render(<HomePage />)
    const order = [...screen.getByTestId("home-page").children].map((section) =>
      section.getAttribute("data-testid")
    )

    expect(order).toEqual([
      "home-right-now",
      "home-widgets-row",
      "events-calendar",
    ])
  })

  it("stacks Raids, Upcoming, Projects on mobile and shows Raids, Projects, Upcoming in one lg row", () => {
    render(<HomePage />)
    const row = screen.getByTestId("home-widgets-row")

    expect(row).toHaveClass("grid", "grid-cols-1", "lg:grid-cols-3")
    const [raids, upcoming, projects] = [...row.children]
    expect(raids).toContainElement(screen.getByTestId("home-raids-widget"))
    expect(raids).toHaveClass("lg:order-1")
    expect(projects).toContainElement(
      screen.getByTestId("home-projects-widget")
    )
    expect(projects).toHaveClass("lg:order-2")
    expect(upcoming).toContainElement(screen.getByTestId("home-events-widget"))
    expect(upcoming).toHaveClass("lg:order-3")
  })
})

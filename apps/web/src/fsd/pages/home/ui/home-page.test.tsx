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
  it("orders Right now, then Raids beside Upcoming events, then Projects, then the calendar", () => {
    render(<HomePage />)
    const order = [...screen.getByTestId("home-page").children].map((section) =>
      section.getAttribute("data-testid")
    )

    expect(order).toEqual([
      "home-right-now",
      "home-raids-row",
      "home-projects-widget",
      "events-calendar",
    ])
  })

  it("gives Raids the wider of two md columns and stacks them on mobile in source order", () => {
    render(<HomePage />)
    const row = screen.getByTestId("home-raids-row")

    expect(row).toHaveClass("grid", "grid-cols-1", "md:grid-cols-5")
    const [raids, upcoming] = [...row.children]
    expect(raids).toContainElement(screen.getByTestId("home-raids-widget"))
    expect(raids).toHaveClass("md:col-span-3")
    expect(upcoming).toContainElement(screen.getByTestId("home-events-widget"))
    expect(upcoming).toHaveClass("md:col-span-2")
  })
})

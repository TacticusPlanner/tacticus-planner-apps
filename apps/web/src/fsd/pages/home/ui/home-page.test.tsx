import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { HomePage } from "./home-page"

vi.mock("@/shared/tour", () => ({ useAutoStartTourOnce: () => undefined }))
vi.mock("./home-page.tutorial", () => ({
  useHomePageTutorial: () => undefined,
}))
vi.mock("./token-availability/token-availability", () => ({
  TokenAvailability: () => <div data-testid="token-availability" />,
}))
vi.mock("./events-widget/home-events-widget", () => ({
  HomeEventsWidget: () => <div data-testid="home-events-widget" />,
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
  it("puts Token Availability and Home Screen Events in one md two-column row, stacked on mobile", () => {
    render(<HomePage />)
    const row = screen.getByTestId("token-availability").parentElement!

    expect(row).toContainElement(screen.getByTestId("home-events-widget"))
    expect(row).toHaveClass("grid", "grid-cols-1", "md:grid-cols-2")
    expect(
      [...row.children].map((child) => child.getAttribute("data-testid"))
    ).toEqual(["token-availability", "home-events-widget"])
  })

  it("keeps Projects/Raids after that row and the calendar last", () => {
    render(<HomePage />)
    const order = [...screen.getByTestId("home-page").children].map((section) =>
      [...section.querySelectorAll("[data-testid]")]
        .concat(section.matches("[data-testid]") ? [section] : [])
        .map((el) => el.getAttribute("data-testid"))
        .sort()
        .join("+")
    )

    expect(order).toEqual([
      "home-events-widget+token-availability",
      "home-projects-widget+home-raids-widget",
      "events-calendar",
    ])
  })
})

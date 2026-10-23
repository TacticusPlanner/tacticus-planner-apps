import { render, screen } from "@/test/render"
import { MemoryRouter } from "react-router"
import { describe, expect, it, vi } from "vitest"

import type { EventProjectsState } from "../model/use-event-projects"

vi.mock("react-i18next", () => ({
  initReactI18next: { init: () => undefined, type: "3rdParty" },
  useTranslation: () => ({
    t: (key: string, options?: { name?: string; count?: number }) =>
      [key, options?.name, options?.count]
        .filter((part) => part !== undefined)
        .join(":"),
  }),
}))
const { state } = vi.hoisted(() => ({
  state: { current: { status: "hidden" } },
}))
vi.mock("../model/use-event-projects", () => ({
  useEventProjects: () => state.current,
}))

import { EventProjectsLine } from "./event-projects-line"

const renderLine = (next: EventProjectsState) => {
  state.current = next
  return render(
    <MemoryRouter>
      <EventProjectsLine eventId="votanUthar" />
    </MemoryRouter>
  )
}

const uthar = {
  projectId: "p1",
  name: "Uthar run 3",
  description: null,
  color: null,
  status: "Active" as const,
  isDefault: false,
  goalIds: [] as string[],
  target: null,
  revision: 0,
  createdAt: "",
  updatedAt: "",
}

describe("EventProjectsLine", () => {
  it("names each linked project with its goal count and links it on Goals", () => {
    renderLine({
      status: "ready",
      projects: [{ project: uthar, goals: 7 }],
      archivedCount: 2,
    })

    const link = screen.getByTestId("event-project")
    expect(link).toHaveTextContent(
      "goals.project.eventProjectGoals:Uthar run 3:7"
    )
    expect(link).toHaveAttribute("href", "/plan/goals?project=p1")
    expect(screen.getByTestId("event-projects-archived")).toHaveTextContent(
      "goals.project.eventArchived:2"
    )
  })

  it("points to the Projects page when no project targets the event", () => {
    renderLine({ status: "ready", projects: [], archivedCount: 0 })

    expect(screen.getByTestId("event-projects")).toHaveTextContent(
      "goals.project.eventNoProject"
    )
    expect(screen.getByTestId("event-projects-open")).toHaveAttribute(
      "href",
      "/plan/projects"
    )
    expect(screen.queryByTestId("event-projects-archived")).toBeNull()
  })

  it("shows a skeleton while loading and nothing when hidden", () => {
    const { unmount } = renderLine({ status: "loading" })
    expect(screen.getByTestId("event-projects-loading")).toBeInTheDocument()
    unmount()

    const { container } = renderLine({ status: "hidden" })
    expect(container).toBeEmptyDOMElement()
  })
})

import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { createTestI18n, i18nWrapper } from "@/test/i18n"

import { LegendaryEventPlanEntry } from "./legendary-event-plan-entry"
import { hasEventPlan } from "./legendary-event-plan-entry.model"

const projectsState = vi.hoisted(() => ({ value: { status: "loading" } }))

vi.mock("@/features/project-management", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/features/project-management")>()
  return {
    ...actual,
    useEventProjects: () => projectsState.value,
    EventProjectsLine: () => <p data-testid="event-projects" />,
  }
})

const TWO_PER_LANE = (["alpha", "beta", "gamma"] as const).flatMap((laneId) => [
  { laneId },
  { laneId },
])

describe("hasEventPlan", () => {
  it("needs a linked project and at least two teams in every lane", () => {
    expect(hasEventPlan(TWO_PER_LANE, 1)).toBe(true)
    expect(hasEventPlan(TWO_PER_LANE, 0)).toBe(false)
    expect(hasEventPlan(TWO_PER_LANE.slice(1), 1)).toBe(false)
    expect(hasEventPlan(undefined, 1)).toBe(false)
    expect(hasEventPlan(TWO_PER_LANE, undefined)).toBe(false)
  })
})

describe("LegendaryEventPlanEntry", () => {
  beforeEach(() => {
    projectsState.value = { status: "loading" }
  })

  async function renderEntry(teams = TWO_PER_LANE, showButton = true) {
    const i18n = await createTestI18n("en")
    render(
      <MemoryRouter>
        <LegendaryEventPlanEntry
          eventId="votanUthar"
          showButton={showButton}
          teams={teams}
        />
      </MemoryRouter>,
      { wrapper: i18nWrapper(i18n) }
    )
    return screen.queryByTestId("legendary-event-plan-wizard")
  }

  it("offers a primary Plan this event until the event has a plan", async () => {
    const button = await renderEntry()
    expect(button).toHaveTextContent("Plan this event")
    expect(button).toHaveAttribute("data-planned", "false")
    expect(button).toHaveAttribute(
      "href",
      "/legendary-events/votanUthar/plan?from=overview"
    )
    expect(screen.getByTestId("event-projects")).toBeInTheDocument()
  })

  it("offers a secondary Refine plan once a project and the teams exist", async () => {
    projectsState.value = {
      status: "ready",
      projects: [{ project: { projectId: "p1" }, goals: 6 }],
      archivedCount: 0,
    } as never
    const button = await renderEntry()
    expect(button).toHaveTextContent("Refine plan")
    expect(button).toHaveAttribute("data-planned", "true")
  })

  it("keeps the projects line without the button where the wizard is unavailable", async () => {
    expect(await renderEntry(TWO_PER_LANE, false)).toBeNull()
    expect(screen.getByTestId("event-projects")).toBeInTheDocument()
  })
})

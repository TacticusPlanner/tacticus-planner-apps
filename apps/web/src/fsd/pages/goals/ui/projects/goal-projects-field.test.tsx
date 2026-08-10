import { render, screen } from "@/test/render"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

vi.mock("react-i18next", () => ({
  initReactI18next: { init: () => undefined, type: "3rdParty" },
  useTranslation: () => ({ t: (key: string) => key }),
}))

import type { ProjectSummary } from "@/entities/project"
import { GoalProjectsField } from "./goal-projects-field"

const project = (
  projectId: string,
  overrides: Partial<ProjectSummary> = {}
): ProjectSummary => ({
  projectId,
  name: projectId,
  description: null,
  color: null,
  status: "Active",
  isActivePlan: false,
  isDefault: false,
  revision: 1,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  ...overrides,
})

describe("GoalProjectsField", () => {
  it("protects the last membership and retains archived selected chips", async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()
    render(
      <GoalProjectsField
        onToggle={onToggle}
        projects={[project("archived", { status: "Archived" })]}
        projectsValid
        selectedProjectIds={["archived"]}
      />
    )

    expect(screen.getByText("goals.status.Archived")).toBeInTheDocument()
    await user.click(
      screen.getByRole("button", { name: "goals.project.removeMembership" })
    )
    expect(onToggle).not.toHaveBeenCalled()
    expect(
      screen.getByText("goals.detail.projectsRequired")
    ).toBeInTheDocument()
  })

  it("searches addable projects while excluding selected and archived projects", async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()
    render(
      <GoalProjectsField
        onToggle={onToggle}
        projects={[
          project("selected"),
          project("Event plan"),
          project("archived", { status: "Archived" }),
        ]}
        projectsValid
        selectedProjectIds={["selected"]}
      />
    )

    await user.click(screen.getByTestId("goal-detail-add-project"))
    expect(screen.queryByText("archived")).not.toBeInTheDocument()
    await user.type(
      screen.getByPlaceholderText("goals.project.searchProjects"),
      "Event"
    )
    await user.click(screen.getByText("Event plan"))
    expect(onToggle).toHaveBeenCalledWith("Event plan", true)
  })

  it("portals the picker into the enclosing Sheet container", async () => {
    const user = userEvent.setup()
    const portalContainer = document.createElement("div")
    document.body.append(portalContainer)

    render(
      <GoalProjectsField
        onToggle={vi.fn()}
        portalContainer={portalContainer}
        projects={[project("selected"), project("available")]}
        projectsValid
        selectedProjectIds={["selected"]}
      />
    )

    await user.click(screen.getByTestId("goal-detail-add-project"))
    expect(portalContainer).toContainElement(
      screen.getByPlaceholderText("goals.project.searchProjects")
    )
    portalContainer.remove()
  })

  it("shows Current plan and Default markers with a project-specific conflict", () => {
    render(
      <GoalProjectsField
        conflicts={[
          {
            projectId: "current",
            existingGoalId: "existing-goal",
            goalTypes: ["Rank"],
          },
        ]}
        onToggle={vi.fn()}
        projects={[project("current", { isActivePlan: true, isDefault: true })]}
        projectsValid={false}
        selectedProjectIds={["current"]}
      />
    )

    expect(screen.getByText("goals.project.currentPlan")).toBeInTheDocument()
    expect(
      screen.getByText("goals.create.projectDefaultMarker")
    ).toBeInTheDocument()
    expect(
      screen.getByText("goals.project.membershipConflict")
    ).toBeInTheDocument()
  })
})

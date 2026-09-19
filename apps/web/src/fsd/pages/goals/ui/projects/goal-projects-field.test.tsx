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

const home = project("home", { isDefault: true })

function removeChip(user: ReturnType<typeof userEvent.setup>) {
  return user.click(
    screen.getByRole("button", { name: "goals.project.removeMembership" })
  )
}

describe("GoalProjectsField", () => {
  it("relocates the last membership to the Default project instead of refusing", async () => {
    const user = userEvent.setup()
    const onSelectionChange = vi.fn()
    render(
      <GoalProjectsField
        onSelectionChange={onSelectionChange}
        projects={[project("only"), home]}
        projectsValid
        selectedProjectIds={["only"]}
      />
    )

    await removeChip(user)

    expect(onSelectionChange).toHaveBeenCalledWith(["home"])
    expect(
      screen.queryByText("goals.project.removeLastMembership")
    ).not.toBeInTheDocument()
  })

  it("drops one of several memberships without touching the others", async () => {
    const user = userEvent.setup()
    const onSelectionChange = vi.fn()
    render(
      <GoalProjectsField
        onSelectionChange={onSelectionChange}
        projects={[project("a"), project("b"), home]}
        projectsValid
        selectedProjectIds={["a", "b"]}
      />
    )

    await user.click(
      screen.getAllByRole("button", {
        name: "goals.project.removeMembership",
      })[0]!
    )

    expect(onSelectionChange).toHaveBeenCalledWith(["b"])
  })

  it("refuses when the Default project is itself the only membership", async () => {
    const user = userEvent.setup()
    const onSelectionChange = vi.fn()
    render(
      <GoalProjectsField
        onSelectionChange={onSelectionChange}
        projects={[home]}
        projectsValid
        selectedProjectIds={["home"]}
      />
    )

    await removeChip(user)

    expect(onSelectionChange).not.toHaveBeenCalled()
    expect(
      screen.getByText("goals.project.removeLastMembership")
    ).toBeInTheDocument()
  })

  it("refuses while the destination project is unknown", async () => {
    const user = userEvent.setup()
    const onSelectionChange = vi.fn()
    render(
      <GoalProjectsField
        onSelectionChange={onSelectionChange}
        projects={[project("only")]}
        projectsValid
        selectedProjectIds={["only"]}
      />
    )

    await removeChip(user)

    expect(onSelectionChange).not.toHaveBeenCalled()
    expect(
      screen.getByText("goals.project.removeDestinationUnknown")
    ).toBeInTheDocument()
  })

  it("keeps an archived membership visible and marked", () => {
    render(
      <GoalProjectsField
        onSelectionChange={vi.fn()}
        projects={[project("archived", { status: "Archived" }), home]}
        projectsValid
        selectedProjectIds={["archived"]}
      />
    )

    expect(screen.getByText("archived")).toBeInTheDocument()
    expect(screen.getByText("goals.status.Archived")).toBeInTheDocument()
  })

  it("relocates an archived-only membership to the Default project", async () => {
    const user = userEvent.setup()
    const onSelectionChange = vi.fn()
    render(
      <GoalProjectsField
        onSelectionChange={onSelectionChange}
        projects={[project("archived", { status: "Archived" }), home]}
        projectsValid
        selectedProjectIds={["archived"]}
      />
    )

    await removeChip(user)

    expect(onSelectionChange).toHaveBeenCalledWith(["home"])
  })

  it("searches addable projects while excluding selected and archived projects", async () => {
    const user = userEvent.setup()
    const onSelectionChange = vi.fn()
    render(
      <GoalProjectsField
        onSelectionChange={onSelectionChange}
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
    expect(onSelectionChange).toHaveBeenCalledWith(["selected", "Event plan"])
  })

  it("portals the picker into the enclosing Sheet container", async () => {
    const user = userEvent.setup()
    const portalContainer = document.createElement("div")
    document.body.append(portalContainer)

    render(
      <GoalProjectsField
        onSelectionChange={vi.fn()}
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
        onSelectionChange={vi.fn()}
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

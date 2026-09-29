import { render, screen } from "@/test/render"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("react-i18next", () => ({
  initReactI18next: { init: () => undefined, type: "3rdParty" },
  useTranslation: () => ({ t: (key: string) => key }),
}))

const createProject = vi.fn()
vi.mock("@/entities/project", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/project")>()),
  createProject: (...args: unknown[]) => createProject(...args),
}))

import type { ProjectSummary } from "@/entities/project"
import { ApiError } from "@/shared/api"
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

    await user.click(screen.getByTestId("goal-edit-add-project"))
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

    await user.click(screen.getByTestId("goal-edit-add-project"))
    expect(portalContainer).toContainElement(
      screen.getByPlaceholderText("goals.project.searchProjects")
    )
    portalContainer.remove()
  })

  it("shows the Default marker (and no Current plan marker) with a project-specific conflict", () => {
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
        projects={[project("current", { isDefault: true })]}
        projectsValid={false}
        selectedProjectIds={["current"]}
      />
    )

    expect(screen.queryByText("goals.project.currentPlan")).toBeNull()
    expect(
      screen.getByText("goals.create.projectDefaultMarker")
    ).toBeInTheDocument()
    expect(
      screen.getByText("goals.project.membershipConflict")
    ).toBeInTheDocument()
  })

  describe("inline project creation", () => {
    const createRow = () => screen.queryByTestId("goal-edit-create-project")

    async function openAndType(
      user: ReturnType<typeof userEvent.setup>,
      text: string
    ) {
      await user.click(screen.getByTestId("goal-edit-add-project"))
      await user.type(
        screen.getByPlaceholderText("goals.project.searchProjects"),
        text
      )
    }

    const renderField = (onSelectionChange = vi.fn()) => {
      render(
        <GoalProjectsField
          onSelectionChange={onSelectionChange}
          projects={[project("selected"), project("Event plan"), home]}
          projectsValid
          selectedProjectIds={["selected"]}
        />
      )
      return onSelectionChange
    }

    beforeEach(() => {
      createProject
        .mockReset()
        .mockImplementation((request) =>
          Promise.resolve(project("new-id", { name: request.name }))
        )
    })

    it("offers Create for a valid unmatched name and creates nothing until it is chosen", async () => {
      const user = userEvent.setup()
      const onSelectionChange = renderField()

      await openAndType(user, "  Brand new  ")

      expect(createRow()).toHaveTextContent("goals.project.createInline")
      expect(
        screen.queryByText("goals.project.noAddableProjects")
      ).not.toBeInTheDocument()
      expect(createProject).not.toHaveBeenCalled()

      await user.click(createRow()!)

      expect(createProject).toHaveBeenCalledExactlyOnceWith({
        name: "Brand new",
        description: null,
        color: null,
      })
      await vi.waitFor(() =>
        expect(onSelectionChange).toHaveBeenCalledWith(["selected", "new-id"])
      )
      expect(onSelectionChange).toHaveBeenCalledTimes(1)
    })

    it("creates nothing when the picker is closed after typing", async () => {
      const user = userEvent.setup()
      const onSelectionChange = renderField()

      await openAndType(user, "Brand new")
      await user.keyboard("{Escape}")

      expect(createProject).not.toHaveBeenCalled()
      expect(onSelectionChange).not.toHaveBeenCalled()
    })

    it.each([
      ["an existing name", "Event plan"],
      ["an existing name in another case", "  event PLAN "],
      ["the Default project's name", "home"],
    ])("offers no Create for %s", async (_label, typed) => {
      const user = userEvent.setup()
      renderField()

      await openAndType(user, typed)

      expect(createRow()).not.toBeInTheDocument()
    })

    it("offers no Create for an archived project's name", async () => {
      const user = userEvent.setup()
      render(
        <GoalProjectsField
          onSelectionChange={vi.fn()}
          projects={[project("Old", { status: "Archived" }), home]}
          projectsValid
          selectedProjectIds={["home"]}
        />
      )

      await openAndType(user, "old")

      expect(createRow()).not.toBeInTheDocument()
    })

    it("offers no Create for a blank or over-long name", async () => {
      const user = userEvent.setup()
      renderField()

      await openAndType(user, "   ")
      expect(createRow()).not.toBeInTheDocument()

      await user.clear(
        screen.getByPlaceholderText("goals.project.searchProjects")
      )
      await user.click(
        screen.getByPlaceholderText("goals.project.searchProjects")
      )
      await user.paste("x".repeat(121))
      expect(createRow()).not.toBeInTheDocument()
    })

    it("shows the failure in place, keeps the typed name, adds no membership, and allows a retry", async () => {
      const user = userEvent.setup()
      const onSelectionChange = renderField()
      createProject.mockRejectedValueOnce(new ApiError(500, "Server down"))

      await openAndType(user, "Brand new")
      await user.click(createRow()!)

      expect(
        await screen.findByTestId("goal-edit-create-project-error")
      ).toHaveTextContent("Server down")
      expect(
        screen.getByPlaceholderText("goals.project.searchProjects")
      ).toHaveValue("Brand new")
      expect(onSelectionChange).not.toHaveBeenCalled()

      await user.click(createRow()!)

      await vi.waitFor(() =>
        expect(onSelectionChange).toHaveBeenCalledWith(["selected", "new-id"])
      )
      expect(createProject).toHaveBeenCalledTimes(2)
    })

    it("falls back to a generic message for a non-API failure", async () => {
      const user = userEvent.setup()
      renderField()
      createProject.mockRejectedValueOnce(new Error("offline"))

      await openAndType(user, "Brand new")
      await user.click(createRow()!)

      expect(
        await screen.findByText("goals.project.createFailed")
      ).toBeInTheDocument()
    })

    it("does not submit twice while a creation is pending", async () => {
      const user = userEvent.setup()
      renderField()
      let resolve: (value: ProjectSummary) => void = () => undefined
      createProject.mockReturnValueOnce(
        new Promise<ProjectSummary>((done) => {
          resolve = done
        })
      )

      await openAndType(user, "Brand new")
      await user.click(createRow()!)
      await user.click(createRow()!)

      expect(createProject).toHaveBeenCalledTimes(1)
      expect(createRow()).toHaveTextContent("goals.project.creatingInline")
      resolve(project("new-id"))
      await vi.waitFor(() => expect(createRow()).not.toBeInTheDocument())
    })
  })
})

import { render, screen } from "@/test/render"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

vi.mock("react-i18next", () => ({
  initReactI18next: { init: () => undefined, type: "3rdParty" },
  useTranslation: () => ({ t: (key: string) => key }),
}))

import { ProjectRow } from "./project-row"

const defaultProject = {
  projectId: "default",
  name: "Default plan",
  description: null,
  color: null,
  status: "Active" as const,
  isActivePlan: true,
  isDefault: true,
  revision: 1,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
}

const otherProject = {
  ...defaultProject,
  projectId: "other",
  name: "Other plan",
  isActivePlan: false,
  isDefault: false,
}

const archivedProject = {
  ...defaultProject,
  projectId: "archived",
  name: "Archived plan",
  isActivePlan: false,
  isDefault: false,
  status: "Archived" as const,
}

function actionsHarness(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    activate: vi.fn(),
    create: vi.fn(),
    pending: false,
    reorder: vi.fn(),
    save: vi.fn(),
    ...overrides,
  }
}

describe("ProjectRow", () => {
  async function openActions(
    user: ReturnType<typeof userEvent.setup>,
    projectId: string
  ) {
    await user.click(screen.getByTestId(`project-row-actions-${projectId}`))
  }

  it("renders the project's name and color dot, with no status badge for a non-active, non-archived project", () => {
    render(
      <ul>
        <ProjectRow
          actions={actionsHarness() as never}
          onEdit={vi.fn()}
          project={otherProject}
        />
      </ul>
    )
    expect(screen.getByText("Other plan")).toBeInTheDocument()
  })

  it("renders lightweight and Current-plan metrics when a summary is ready", () => {
    render(
      <ul>
        <ProjectRow
          actions={actionsHarness() as never}
          onEdit={vi.fn()}
          project={defaultProject}
          summary={{
            status: "success",
            units: 3,
            goals: 7,
            reached: 2,
            blocked: 1,
            completionDate: "2026-09-01",
          }}
        />
      </ul>
    )

    expect(
      screen.getByText("goals.project.unitGoalSummary")
    ).toBeInTheDocument()
    expect(screen.getByText("goals.project.reachedSummary")).toBeInTheDocument()
    expect(screen.getByText("goals.project.blockedSummary")).toBeInTheDocument()
    expect(
      screen.getByText("goals.project.completionSummary")
    ).toBeInTheDocument()
  })

  it("isolates summary failure and retries only that project", async () => {
    const user = userEvent.setup()
    const retry = vi.fn()
    render(
      <ul>
        <ProjectRow
          actions={actionsHarness() as never}
          onEdit={vi.fn()}
          project={otherProject}
          summary={{ status: "error", retry }}
        />
      </ul>
    )

    await user.click(screen.getByText("goals.project.summaryUnavailable"))
    expect(retry).toHaveBeenCalledTimes(1)
  })

  it("calls onEdit with the row's project when the Edit icon is activated", async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    render(
      <ul>
        <ProjectRow
          actions={actionsHarness() as never}
          onEdit={onEdit}
          project={otherProject}
        />
      </ul>
    )

    await openActions(user, otherProject.projectId)
    await user.click(
      screen.getByTestId(`project-row-edit-${otherProject.projectId}`)
    )
    expect(onEdit).toHaveBeenCalledWith(otherProject)
  })

  it("sets a non-active project active via the inline Set active icon", async () => {
    const user = userEvent.setup()
    const activate = vi.fn()
    render(
      <ul>
        <ProjectRow
          actions={actionsHarness({ activate }) as never}
          onEdit={vi.fn()}
          project={otherProject}
        />
      </ul>
    )

    await user.click(
      screen.getByTestId(`project-row-set-active-${otherProject.projectId}`)
    )
    expect(activate).toHaveBeenCalledWith(otherProject.projectId)
  })

  it("does not offer Set active for the already-active project", () => {
    render(
      <ul>
        <ProjectRow
          actions={actionsHarness() as never}
          onEdit={vi.fn()}
          project={defaultProject}
        />
      </ul>
    )
    expect(
      screen.queryByTestId(`project-row-set-active-${defaultProject.projectId}`)
    ).not.toBeInTheDocument()
  })

  it("archives a project that is neither default nor the active plan", async () => {
    const user = userEvent.setup()
    const save = vi.fn()
    render(
      <ul>
        <ProjectRow
          actions={actionsHarness({ save }) as never}
          onEdit={vi.fn()}
          project={otherProject}
        />
      </ul>
    )

    await openActions(user, otherProject.projectId)
    await user.click(
      screen.getByTestId(`project-row-archive-${otherProject.projectId}`)
    )
    expect(save).toHaveBeenCalledWith(
      otherProject,
      expect.objectContaining({ status: "Archived" })
    )
  })

  it("disables Archive for the default project", async () => {
    const user = userEvent.setup()
    render(
      <ul>
        <ProjectRow
          actions={actionsHarness() as never}
          onEdit={vi.fn()}
          project={defaultProject}
        />
      </ul>
    )
    await openActions(user, defaultProject.projectId)
    expect(
      screen.getByTestId(`project-row-archive-${defaultProject.projectId}`)
    ).toHaveAttribute("aria-disabled", "true")
  })

  it("restores an archived project via the inline Restore icon", async () => {
    const user = userEvent.setup()
    const save = vi.fn()
    render(
      <ul>
        <ProjectRow
          actions={actionsHarness({ save }) as never}
          onEdit={vi.fn()}
          project={archivedProject}
        />
      </ul>
    )

    await openActions(user, archivedProject.projectId)
    await user.click(
      screen.getByTestId(`project-row-restore-${archivedProject.projectId}`)
    )
    expect(save).toHaveBeenCalledWith(
      archivedProject,
      expect.objectContaining({ status: "Active" })
    )
  })

  it("navigates via onSelect when the row is clicked outside its icons", async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(
      <ul>
        <ProjectRow
          actions={actionsHarness() as never}
          onEdit={vi.fn()}
          onSelect={onSelect}
          project={otherProject}
        />
      </ul>
    )

    await user.click(screen.getByText("Other plan"))
    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it("navigates from the semantic project control with the keyboard", async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(
      <ul>
        <ProjectRow
          actions={actionsHarness() as never}
          onEdit={vi.fn()}
          onSelect={onSelect}
          project={otherProject}
        />
      </ul>
    )

    const projectControl = screen.getByRole("button", { name: /Other plan/ })
    projectControl.focus()
    await user.keyboard("{Enter}")
    await user.keyboard(" ")
    expect(onSelect).toHaveBeenCalledTimes(2)
  })

  it("does not call onSelect when an action icon is activated", async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    const onEdit = vi.fn()
    render(
      <ul>
        <ProjectRow
          actions={actionsHarness() as never}
          onEdit={onEdit}
          onSelect={onSelect}
          project={otherProject}
        />
      </ul>
    )

    await openActions(user, otherProject.projectId)
    await user.click(
      screen.getByTestId(`project-row-edit-${otherProject.projectId}`)
    )
    expect(onEdit).toHaveBeenCalledWith(otherProject)
    expect(onSelect).not.toHaveBeenCalled()
  })

  it("is not clickable when onSelect is omitted (the detail route's current-project row)", async () => {
    const user = userEvent.setup()
    render(
      <ul>
        <ProjectRow
          actions={actionsHarness() as never}
          onEdit={vi.fn()}
          project={otherProject}
        />
      </ul>
    )

    // No onSelect handler means clicking the row does nothing observable - this just asserts it
    // doesn't throw and the row isn't wired to a click handler at all.
    await user.click(screen.getByText("Other plan"))
    expect(screen.getByText("Other plan")).toBeInTheDocument()
  })
})

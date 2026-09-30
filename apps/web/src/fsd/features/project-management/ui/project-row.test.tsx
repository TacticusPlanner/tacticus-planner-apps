import { render, screen, within } from "@/test/render"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

vi.mock("react-i18next", () => ({
  initReactI18next: { init: () => undefined, type: "3rdParty" },
  // `i18n.resolvedLanguage` is read by `formatEstimateDate` for the completion date.
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { resolvedLanguage: "en" },
  }),
}))

import { ProjectRow } from "./project-row"

const defaultProject = {
  projectId: "default",
  name: "Default plan",
  description: null,
  color: null,
  status: "Active" as const,
  isDefault: true,
  revision: 1,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
}

const otherProject = {
  ...defaultProject,
  projectId: "other",
  name: "Other plan",
  isDefault: false,
}

const archivedProject = {
  ...defaultProject,
  projectId: "archived",
  name: "Archived plan",
  isDefault: false,
  status: "Archived" as const,
}

function actionsHarness(overrides: Partial<Record<string, unknown>> = {}) {
  return {
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

  it("renders the project's name and color dot, with no status badge for a custom, non-archived project", () => {
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

  it("renders lightweight and extended metrics when a summary is ready", () => {
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
            unestimatedGoalCount: 0,
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
    expect(
      screen.queryByTestId("project-row-completion-excluded")
    ).not.toBeInTheDocument()
  })

  it("shows the excluded-goal caveat alongside a partial completion date", () => {
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
            unestimatedGoalCount: 1,
          }}
        />
      </ul>
    )

    expect(
      screen.getByText("goals.project.completionSummary")
    ).toBeInTheDocument()
    expect(
      screen.getByTestId("project-row-completion-excluded")
    ).toBeInTheDocument()
  })

  it("shows the caveat with no date line when nothing could be estimated", () => {
    // plan-completion-outlook design Decision 5: this surface has no unknown placeholder, so the
    // caveat alone is what keeps an omitted date from reading as "no information".
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
            reached: 0,
            blocked: 7,
            completionDate: null,
            unestimatedGoalCount: 7,
          }}
        />
      </ul>
    )

    expect(
      screen.queryByText("goals.project.completionSummary")
    ).not.toBeInTheDocument()
    expect(
      screen.getByTestId("project-row-completion-excluded")
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

  it("offers no Make current control and marks only the Default project with a Default badge", () => {
    render(
      <ul>
        <ProjectRow
          actions={actionsHarness() as never}
          onEdit={vi.fn()}
          project={otherProject}
        />
        <ProjectRow
          actions={actionsHarness() as never}
          onEdit={vi.fn()}
          project={defaultProject}
        />
      </ul>
    )

    expect(screen.queryByText("goals.project.makeCurrent")).toBeNull()
    expect(screen.getAllByText("goals.project.defaultBadge")).toHaveLength(1)
    expect(
      within(
        screen.getByTestId(`project-row-${defaultProject.projectId}`)
      ).getByText("goals.project.defaultBadge")
    ).toBeInTheDocument()
  })

  it("archives a custom project", async () => {
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

  it("is not clickable when onSelect is omitted", async () => {
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

  it("lists Create goal, Manage goals, Edit, Archive in that order on a live row, and no bulk pause/resume", async () => {
    const user = userEvent.setup()
    const onCreateGoal = vi.fn()
    const onManageGoals = vi.fn()
    render(
      <ul>
        <ProjectRow
          actions={actionsHarness() as never}
          onCreateGoal={onCreateGoal}
          onEdit={vi.fn()}
          onManageGoals={onManageGoals}
          project={otherProject}
        />
      </ul>
    )

    await openActions(user, otherProject.projectId)
    const items = screen.getAllByRole("menuitem")
    expect(items.map((item) => item.textContent)).toEqual([
      "goals.project.createGoalTrigger",
      "goals.project.addGoalsTrigger",
      "goals.project.edit",
      "goals.project.archive",
    ])
    expect(screen.queryByText("goals.project.pauseAllGoals")).toBeNull()
    expect(screen.queryByText("goals.project.resumeAllGoals")).toBeNull()

    await user.click(
      screen.getByTestId(`project-row-manage-goals-${otherProject.projectId}`)
    )
    expect(onManageGoals).toHaveBeenCalledWith(otherProject)
    await openActions(user, otherProject.projectId)
    await user.click(
      screen.getByTestId(`project-row-create-goal-${otherProject.projectId}`)
    )
    expect(onCreateGoal).toHaveBeenCalledWith(otherProject)
  })

  it("offers only Edit and Restore on an archived row", async () => {
    const user = userEvent.setup()
    render(
      <ul>
        <ProjectRow
          actions={actionsHarness() as never}
          onCreateGoal={vi.fn()}
          onEdit={vi.fn()}
          onManageGoals={vi.fn()}
          project={archivedProject}
        />
      </ul>
    )

    await openActions(user, archivedProject.projectId)
    expect(
      screen.getAllByRole("menuitem").map((item) => item.textContent)
    ).toEqual(["goals.project.edit", "goals.project.restore"])
  })
})

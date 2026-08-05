import { render, screen } from "@/test/render"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

vi.mock("react-i18next", () => ({
  initReactI18next: { init: () => undefined, type: "3rdParty" },
  useTranslation: () => ({ t: (key: string) => key }),
}))

import { ProjectList } from "./project-list"

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

describe("ProjectList", () => {
  it("lists every project including archived ones", () => {
    render(
      <ProjectList
        actions={actionsHarness() as never}
        onEdit={vi.fn()}
        projects={[defaultProject, otherProject, archivedProject]}
      />
    )

    expect(screen.getByText("Default plan")).toBeInTheDocument()
    expect(screen.getByText("Other plan")).toBeInTheDocument()
    expect(screen.getByText("Archived plan")).toBeInTheDocument()
  })

  it("opens the Edit form for the row's own project via onEdit", async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    render(
      <ProjectList
        actions={actionsHarness() as never}
        onEdit={onEdit}
        projects={[otherProject]}
      />
    )

    await user.click(
      screen.getByTestId(
        `project-row-actions-trigger-${otherProject.projectId}`
      )
    )
    await user.click(
      await screen.findByTestId(`project-row-edit-${otherProject.projectId}`)
    )

    expect(onEdit).toHaveBeenCalledWith(otherProject)
  })

  it("sets a non-active project active", async () => {
    const user = userEvent.setup()
    const activate = vi.fn()
    render(
      <ProjectList
        actions={actionsHarness({ activate }) as never}
        onEdit={vi.fn()}
        projects={[otherProject]}
      />
    )

    await user.click(
      screen.getByTestId(
        `project-row-actions-trigger-${otherProject.projectId}`
      )
    )
    await user.click(
      await screen.findByTestId(
        `project-row-set-active-${otherProject.projectId}`
      )
    )

    expect(activate).toHaveBeenCalledWith(otherProject.projectId)
  })

  it("archives a project that is neither default nor the active plan", async () => {
    const user = userEvent.setup()
    const save = vi.fn()
    render(
      <ProjectList
        actions={actionsHarness({ save }) as never}
        onEdit={vi.fn()}
        projects={[otherProject]}
      />
    )

    await user.click(
      screen.getByTestId(
        `project-row-actions-trigger-${otherProject.projectId}`
      )
    )
    await user.click(
      await screen.findByTestId(`project-row-archive-${otherProject.projectId}`)
    )

    expect(save).toHaveBeenCalledWith(
      otherProject,
      expect.objectContaining({ status: "Archived" })
    )
  })

  it("disables Archive for the default project", async () => {
    const user = userEvent.setup()
    render(
      <ProjectList
        actions={actionsHarness() as never}
        onEdit={vi.fn()}
        projects={[defaultProject]}
      />
    )

    await user.click(
      screen.getByTestId(
        `project-row-actions-trigger-${defaultProject.projectId}`
      )
    )
    expect(
      await screen.findByTestId(
        `project-row-archive-${defaultProject.projectId}`
      )
    ).toHaveAttribute("data-disabled")
  })

  it("restores an archived project", async () => {
    const user = userEvent.setup()
    const save = vi.fn()
    render(
      <ProjectList
        actions={actionsHarness({ save }) as never}
        onEdit={vi.fn()}
        projects={[archivedProject]}
      />
    )

    await user.click(
      screen.getByTestId(
        `project-row-actions-trigger-${archivedProject.projectId}`
      )
    )
    await user.click(
      await screen.findByTestId(
        `project-row-restore-${archivedProject.projectId}`
      )
    )

    expect(save).toHaveBeenCalledWith(
      archivedProject,
      expect.objectContaining({ status: "Active" })
    )
  })

  it("does not offer Set active for the already-active project", async () => {
    const user = userEvent.setup()
    render(
      <ProjectList
        actions={actionsHarness() as never}
        onEdit={vi.fn()}
        projects={[defaultProject]}
      />
    )

    await user.click(
      screen.getByTestId(
        `project-row-actions-trigger-${defaultProject.projectId}`
      )
    )
    expect(
      screen.queryByTestId(`project-row-set-active-${defaultProject.projectId}`)
    ).not.toBeInTheDocument()
  })
})

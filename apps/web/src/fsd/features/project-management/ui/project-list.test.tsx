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
        onSelect={vi.fn()}
        projects={[defaultProject, otherProject, archivedProject]}
      />
    )

    expect(screen.getByText("Default plan")).toBeInTheDocument()
    expect(screen.getByText("Other plan")).toBeInTheDocument()
    expect(screen.getByText("Archived plan")).toBeInTheDocument()
  })

  it("calls onSelect with the clicked row's project", async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(
      <ProjectList
        actions={actionsHarness() as never}
        onEdit={vi.fn()}
        onSelect={onSelect}
        projects={[defaultProject, otherProject]}
      />
    )

    await user.click(screen.getByText("Other plan"))
    expect(onSelect).toHaveBeenCalledWith(otherProject)
  })

  it("does not call onSelect when a row's action icon is activated", async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    const onEdit = vi.fn()
    render(
      <ProjectList
        actions={actionsHarness() as never}
        onEdit={onEdit}
        onSelect={onSelect}
        projects={[otherProject]}
      />
    )

    await user.click(
      screen.getByTestId(`project-row-actions-${otherProject.projectId}`)
    )
    await user.click(
      screen.getByTestId(`project-row-edit-${otherProject.projectId}`)
    )
    expect(onEdit).toHaveBeenCalledWith(otherProject)
    expect(onSelect).not.toHaveBeenCalled()
  })
})

import { fireEvent, render, screen } from "@/test/render"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

vi.mock("react-i18next", () => ({
  initReactI18next: { init: () => undefined, type: "3rdParty" },
  useTranslation: () => ({ t: (key: string) => key }),
}))

import { ManageProjectsSheet } from ".//manage-projects-sheet"

const activeProject = {
  projectId: "active",
  name: "Active plan",
  description: "Current",
  color: "#111111",
  status: "Active",
  isActivePlan: false,
  isDefault: false,
  revision: 1,
}

describe("ManageProjectsSheet", () => {
  it("creates a project with a blank form and closes on success", async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    const actions = {
      activate: vi.fn(),
      create: vi.fn().mockResolvedValue(true),
      pending: false,
      reorder: vi.fn(),
      save: vi.fn(),
    }

    render(
      <ManageProjectsSheet
        actions={actions as never}
        onOpenChange={onOpenChange}
        open
        project={undefined}
      />
    )

    expect(
      screen.getByText("goals.project.newProjectTitle")
    ).toBeInTheDocument()
    expect(screen.getByLabelText("goals.project.name")).toHaveValue("")

    const form = document.querySelector("#manage-project-form")!
    fireEvent.submit(form)
    expect(actions.create).not.toHaveBeenCalled()

    await user.type(screen.getByLabelText("goals.project.name"), " New plan ")
    await user.type(
      screen.getByLabelText("goals.project.description"),
      " Description "
    )
    await user.type(screen.getByLabelText("goals.project.color"), " #abcdef ")
    await user.click(screen.getByText("goals.project.create"))

    expect(actions.create).toHaveBeenCalledWith(
      "New plan",
      "Description",
      "#abcdef"
    )
    await vi.waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
  })

  it("edits a pre-filled project and closes on success", async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    const actions = {
      activate: vi.fn(),
      create: vi.fn(),
      pending: false,
      reorder: vi.fn(),
      save: vi.fn().mockResolvedValue(true),
    }

    render(
      <ManageProjectsSheet
        actions={actions as never}
        onOpenChange={onOpenChange}
        open
        project={activeProject as never}
      />
    )

    expect(screen.getByText("goals.project.editTitle")).toBeInTheDocument()
    expect(screen.getByLabelText("goals.project.name")).toHaveValue(
      "Active plan"
    )

    fireEvent.change(screen.getByLabelText("goals.project.name"), {
      target: { value: " Renamed " },
    })
    await user.click(screen.getByText("goals.project.save"))

    expect(actions.save).toHaveBeenCalledWith(
      activeProject,
      expect.objectContaining({ name: "Renamed" })
    )
    await vi.waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
  })

  it("does not close the Sheet when saving fails", async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    const actions = {
      activate: vi.fn(),
      create: vi.fn(),
      pending: false,
      reorder: vi.fn(),
      save: vi.fn().mockResolvedValue(false),
    }

    render(
      <ManageProjectsSheet
        actions={actions as never}
        onOpenChange={onOpenChange}
        open
        project={activeProject as never}
      />
    )

    await user.click(screen.getByText("goals.project.save"))
    await vi.waitFor(() => expect(actions.save).toHaveBeenCalled())
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
  })

  it("disables submit while pending or when the name is blank", () => {
    const actions = {
      activate: vi.fn(),
      create: vi.fn(),
      pending: true,
      reorder: vi.fn(),
      save: vi.fn(),
    }

    render(
      <ManageProjectsSheet
        actions={actions as never}
        onOpenChange={vi.fn()}
        open
        project={activeProject as never}
      />
    )

    expect(screen.getByText("goals.project.save")).toBeDisabled()
  })

  it("resets to blank fields when reopened for a new project", () => {
    const actions = {
      activate: vi.fn(),
      create: vi.fn(),
      pending: false,
      reorder: vi.fn(),
      save: vi.fn(),
    }

    const { rerender } = render(
      <ManageProjectsSheet
        actions={actions as never}
        onOpenChange={vi.fn()}
        open
        project={activeProject as never}
      />
    )
    expect(screen.getByLabelText("goals.project.name")).toHaveValue(
      "Active plan"
    )

    rerender(
      <ManageProjectsSheet
        actions={actions as never}
        onOpenChange={vi.fn()}
        open
        project={undefined}
      />
    )
    expect(screen.getByLabelText("goals.project.name")).toHaveValue("")
  })
})

import { fireEvent, render, screen } from "@/test/render"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

import { ManageProjectsSheet } from "./manage-projects-sheet"

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

const archivedProject = {
  ...activeProject,
  projectId: "archived",
  name: "Archived plan",
  status: "Archived",
}

describe("ManageProjectsSheet", () => {
  it("creates, edits, archives, and restores projects", async () => {
    const user = userEvent.setup()
    const actions = {
      activate: vi.fn(),
      bulkStatus: vi.fn(),
      create: vi.fn().mockResolvedValue(true),
      pending: false,
      reorder: vi.fn(),
      save: vi.fn().mockResolvedValue(true),
    }

    render(
      <ManageProjectsSheet
        actions={actions as never}
        onOpenChange={vi.fn()}
        open
        projects={[activeProject, archivedProject] as never}
      />
    )

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
    await vi.waitFor(() =>
      expect(screen.getByLabelText("goals.project.name")).toHaveValue("")
    )

    await user.click(screen.getByText("Active plan"))
    fireEvent.change(screen.getByLabelText("goals.project.name"), {
      target: { value: " Renamed " },
    })
    await user.click(screen.getByText("goals.project.save"))
    expect(actions.save).toHaveBeenCalledWith(
      activeProject,
      expect.objectContaining({ name: "Renamed" })
    )

    await user.click(screen.getByText("goals.project.archive"))
    expect(actions.save).toHaveBeenCalledWith(
      activeProject,
      expect.objectContaining({ status: "Archived" })
    )

    await user.click(screen.getByText("Archived plan"))
    await user.click(screen.getByText("goals.project.restore"))
    expect(actions.save).toHaveBeenCalledWith(
      archivedProject,
      expect.objectContaining({ status: "Active" })
    )

    await user.click(screen.getByText("goals.project.newProject"))
    expect(screen.getByLabelText("goals.project.name")).toHaveValue("")
  })

  it("keeps successful edits normalized and disables pending actions", async () => {
    const user = userEvent.setup()
    const actions = {
      create: vi.fn(),
      pending: true,
      save: vi.fn().mockResolvedValue(true),
    }

    render(
      <ManageProjectsSheet
        actions={actions as never}
        onOpenChange={vi.fn()}
        open
        projects={[activeProject] as never}
      />
    )

    await user.click(screen.getByText("Active plan"))
    expect(screen.getByText("goals.project.archive")).toBeDisabled()
    expect(screen.getByText("goals.project.save")).toBeDisabled()
  })
})

import { fireEvent, render, screen } from "@/test/render"
import { describe, expect, it, vi } from "vitest"

vi.mock("react-i18next", () => ({
  initReactI18next: { init: () => undefined, type: "3rdParty" },
  useTranslation: () => ({ t: (key: string) => key }),
}))

const actions = vi.hoisted(() => ({
  create: vi.fn(),
  save: vi.fn(),
  pending: false,
}))
vi.mock("@/features/project-management", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/project-management")>()),
  useProjectActions: () => actions,
}))

import { QuickCreateProjectSheet } from "./quick-create-project-sheet"

describe("QuickCreateProjectSheet", () => {
  it("opens a blank create form, saves through the existing actions, and closes without navigating", async () => {
    actions.create.mockResolvedValue({ projectId: "p1", name: "Plan" })
    const onOpenChange = vi.fn()
    render(<QuickCreateProjectSheet onOpenChange={onOpenChange} open />)

    expect(screen.getByLabelText("goals.project.name")).toHaveValue("")
    fireEvent.change(screen.getByLabelText("goals.project.name"), {
      target: { value: "Plan" },
    })
    fireEvent.submit(document.querySelector("#manage-project-form")!)

    expect(actions.create).toHaveBeenCalledWith("Plan", null, null)
    await vi.waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
  })

  it("keeps the form and entered values when saving fails", async () => {
    actions.create.mockReset().mockResolvedValue(null)
    const onOpenChange = vi.fn()
    render(<QuickCreateProjectSheet onOpenChange={onOpenChange} open />)

    fireEvent.change(screen.getByLabelText("goals.project.name"), {
      target: { value: "Plan" },
    })
    fireEvent.submit(document.querySelector("#manage-project-form")!)
    await vi.waitFor(() => expect(actions.create).toHaveBeenCalled())

    expect(onOpenChange).not.toHaveBeenCalled()
    expect(screen.getByLabelText("goals.project.name")).toHaveValue("Plan")
  })
})

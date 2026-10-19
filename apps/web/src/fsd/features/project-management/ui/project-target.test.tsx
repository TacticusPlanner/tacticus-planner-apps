import { render, screen, within } from "@/test/render"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router"
import { describe, expect, it, vi } from "vitest"

vi.mock("react-i18next", () => ({
  initReactI18next: { init: () => undefined, type: "3rdParty" },
  useTranslation: () => ({
    t: (key: string, options?: { name?: string }) =>
      options?.name ? `${key}:${options.name}` : key,
    i18n: { language: "en" },
  }),
}))
vi.mock("../model/event-target-options", () => {
  const options = [
    { eventId: "votanUthar", name: "Uthar" },
    { eventId: "astarLysander", name: "Lysander" },
  ]
  return {
    useEventTargetOptions: () => options,
    useEventTargetName: (eventId: string) =>
      options.find((option) => option.eventId === eventId)?.name ?? null,
  }
})

import { ManageProjectsSheet } from "./manage-projects-sheet"
import { ProjectTargetChip } from "./project-target-chip"

const project = {
  projectId: "p1",
  name: "Uthar run 3",
  description: null,
  color: null,
  status: "Active",
  isDefault: false,
  target: { kind: "legendaryEvent", eventId: "votanUthar" },
  revision: 1,
}

const actionsMock = () => ({
  create: vi.fn().mockResolvedValue({ ...project, projectId: "new" }),
  pending: false,
  save: vi.fn().mockResolvedValue(true),
})

function renderSheet(
  actions: ReturnType<typeof actionsMock>,
  edited?: Record<string, unknown>
) {
  render(
    <ManageProjectsSheet
      actions={actions as never}
      onOpenChange={vi.fn()}
      open
      project={edited as never}
    />
  )
}

describe("Project Related to", () => {
  it("creates a project related to the chosen event", async () => {
    const user = userEvent.setup()
    const actions = actionsMock()
    renderSheet(actions)

    await user.type(screen.getByLabelText("goals.project.name"), "Uthar run 3")
    await user.click(screen.getByTestId("project-target"))
    await user.click(screen.getByRole("option", { name: "Uthar" }))
    await user.click(screen.getByText("goals.project.create"))

    expect(actions.create).toHaveBeenCalledWith("Uthar run 3", null, null, {
      kind: "legendaryEvent",
      eventId: "votanUthar",
    })
  })

  it("clears the target when None is picked", async () => {
    const user = userEvent.setup()
    const actions = actionsMock()
    renderSheet(actions, project)

    expect(screen.getByTestId("project-target")).toHaveTextContent("Uthar")
    await user.click(screen.getByTestId("project-target"))
    await user.click(
      screen.getByRole("option", { name: "goals.project.relatedToNone" })
    )
    await user.click(screen.getByText("goals.project.save"))

    expect(actions.save).toHaveBeenCalledWith(
      project,
      expect.objectContaining({ target: null })
    )
  })

  it("has no Related to field on the Default project", () => {
    renderSheet(actionsMock(), { ...project, isDefault: true, target: null })

    expect(screen.queryByTestId("project-target")).toBeNull()
    expect(screen.queryByText("goals.project.relatedTo")).toBeNull()
  })
})

describe("ProjectTargetChip", () => {
  it("links a served event to its page", () => {
    render(
      <MemoryRouter>
        <ProjectTargetChip
          target={{ kind: "legendaryEvent", eventId: "votanUthar" }}
        />
      </MemoryRouter>
    )

    const chip = screen.getByTestId("project-target-chip")
    expect(chip).toHaveTextContent("goals.project.targetChip:Uthar")
    expect(chip).toHaveAttribute("href", "/legendary-events/votanUthar")
  })

  it("shows the id without a link once the event is gone", () => {
    render(
      <ProjectTargetChip
        target={{ kind: "legendaryEvent", eventId: "retiredEvent" }}
      />
    )

    const chip = screen.getByTestId("project-target-chip")
    expect(chip).toHaveTextContent("goals.project.targetChip:retiredEvent")
    expect(chip).not.toHaveAttribute("href")
    expect(within(chip.parentElement!).queryByRole("link")).toBeNull()
  })
})

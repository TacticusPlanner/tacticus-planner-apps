import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@/test/render"
import userEvent from "@testing-library/user-event"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

const { useIsMobileMock } = vi.hoisted(() => ({
  useIsMobileMock: vi.fn(() => false),
}))

vi.mock("@workspace/ui/hooks/use-mobile", () => ({
  useIsMobile: () => useIsMobileMock(),
}))

import { ProjectSelect } from "./project-select"

const projects = [
  {
    projectId: "proj-1",
    name: "My Plan",
    description: null,
    color: "#6366f1",
    status: "Active" as const,
    isActivePlan: true,
    isDefault: true,
    revision: 0,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
]

describe("ProjectSelect", () => {
  beforeEach(() => {
    useIsMobileMock.mockReturnValue(false)
  })

  it("shows the selected project's text label on desktop", () => {
    render(
      <ProjectSelect
        onProjectIdChange={vi.fn()}
        projectId="proj-1"
        projects={projects}
        testId="project-select"
      />
    )

    expect(screen.getByTestId("project-select")).toHaveTextContent("My Plan")
  })

  it("renders icon-only below the mobile breakpoint while keeping an accessible name", () => {
    useIsMobileMock.mockReturnValue(true)
    render(
      <ProjectSelect
        onProjectIdChange={vi.fn()}
        placeholder="Select a project"
        projectId="proj-1"
        projects={projects}
        testId="project-select"
      />
    )

    const trigger = screen.getByTestId("project-select")
    expect(trigger).not.toHaveTextContent("My Plan")
    expect(trigger).toHaveAccessibleName("Select a project")
  })

  it("calls onProjectIdChange when a different project is selected", async () => {
    const user = userEvent.setup()
    const onProjectIdChange = vi.fn()
    const secondProject = {
      ...projects[0]!,
      projectId: "proj-2",
      name: "Other Plan",
    }
    render(
      <ProjectSelect
        onProjectIdChange={onProjectIdChange}
        projectId="proj-1"
        projects={[...projects, secondProject]}
        testId="project-select"
      />
    )

    await user.click(screen.getByTestId("project-select"))
    await user.click(await screen.findByRole("option", { name: /Other Plan/ }))

    expect(onProjectIdChange).toHaveBeenCalledWith("proj-2")
  })
})

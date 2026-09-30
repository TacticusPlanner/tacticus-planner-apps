import { describe, expect, it, vi } from "vitest"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import type { ProjectSummary } from "@/entities/project"

vi.mock("react-i18next", () => ({
  initReactI18next: { type: "3rdParty", init: () => undefined },
  useTranslation: () => ({ t: (key: string) => key }),
}))

import { GoalsProjectScope } from "./goals-project-scope"

const project = (
  projectId: string,
  name: string,
  overrides: Partial<ProjectSummary> = {}
) =>
  ({
    projectId,
    name,
    description: null,
    color: null,
    status: "Active",
    isDefault: false,
    revision: 0,
    createdAt: "",
    updatedAt: "",
    ...overrides,
  }) as ProjectSummary

const projects = [
  project("neuro", "Neuro"),
  project("default", "My Goals", { isDefault: true }),
  project("old", "Old", { status: "Archived" }),
]

function renderScope(
  overrides: Partial<Parameters<typeof GoalsProjectScope>[0]> = {}
) {
  const onSelect = vi.fn()
  render(
    <GoalsProjectScope
      counts={
        new Map([
          ["default", 16],
          ["neuro", 5],
        ])
      }
      failed={false}
      loading={false}
      onSelect={onSelect}
      projects={projects}
      selectedId={undefined}
      totalCount={16}
      {...overrides}
    />
  )
  return { onSelect }
}

describe("GoalsProjectScope", () => {
  it("lists All goals, then Default, then other non-archived projects, with counts", () => {
    renderScope()
    const chips = within(
      screen.getByTestId("goals-project-scope")
    ).getAllByRole("button")
    expect(chips.map((chip) => chip.textContent)).toEqual([
      "goals.project.scopeAll16",
      "My Goals16",
      "Neuro5",
    ])
    expect(screen.getByTestId("goals-project-scope-all")).toHaveAttribute(
      "aria-pressed",
      "true"
    )
    expect(screen.queryByText("Old")).not.toBeInTheDocument()
  })

  it("marks exactly the selected project and reports selections", async () => {
    const user = userEvent.setup()
    const { onSelect } = renderScope({ selectedId: "neuro" })
    expect(
      screen.getByTestId("goals-project-scope-chip-neuro")
    ).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByTestId("goals-project-scope-all")).toHaveAttribute(
      "aria-pressed",
      "false"
    )

    await user.click(screen.getByTestId("goals-project-scope-chip-default"))
    expect(onSelect).toHaveBeenLastCalledWith("default")
    await user.click(screen.getByTestId("goals-project-scope-all"))
    expect(onSelect).toHaveBeenLastCalledWith(undefined)
  })

  it("shows skeleton chips while loading and only All goals on failure or with no projects", () => {
    const { unmount } = render(
      <GoalsProjectScope
        counts={new Map()}
        failed={false}
        loading
        onSelect={vi.fn()}
        projects={[]}
        selectedId={undefined}
        totalCount={0}
      />
    )
    expect(screen.getByTestId("goals-project-scope-all")).toBeInTheDocument()
    expect(
      screen
        .getByTestId("goals-project-scope")
        .querySelectorAll("[data-slot='skeleton']")
    ).toHaveLength(2)
    unmount()

    for (const props of [
      { failed: true, projects },
      { failed: false, projects: [] },
    ]) {
      const view = render(
        <GoalsProjectScope
          counts={new Map()}
          loading={false}
          onSelect={vi.fn()}
          selectedId={undefined}
          totalCount={0}
          {...props}
        />
      )
      expect(
        within(screen.getByTestId("goals-project-scope")).getAllByRole("button")
      ).toHaveLength(1)
      view.unmount()
    }
  })

  it("collapses into a select once there are more than three projects", () => {
    renderScope({
      projects: [...projects, project("a", "A"), project("b", "B")],
    })
    expect(screen.queryByTestId("goals-project-scope-all")).toBeNull()
    expect(screen.getByRole("combobox")).toBeInTheDocument()
  })
})

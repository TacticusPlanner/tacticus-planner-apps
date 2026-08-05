import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string }) =>
      opts?.defaultValue ?? key,
  }),
}))

import { GoalsLayout } from ".//goals-layout"

function renderLayout(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route element={<GoalsLayout />} path="/goals">
          <Route index element={<div data-testid="goals-child" />} />
          <Route
            element={<div data-testid="projects-child" />}
            path="project"
          />
          <Route
            element={<div data-testid="insights-child" />}
            path="insights"
          />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}

describe("GoalsLayout", () => {
  it("renders the Goals child route at /goals, with the Goals tab active", () => {
    renderLayout("/goals")

    expect(screen.getByTestId("goals-child")).toBeInTheDocument()
    expect(screen.queryByTestId("insights-child")).not.toBeInTheDocument()
  })

  it("renders the Insights child route at /goals/insights, with the Insights tab active", () => {
    renderLayout("/goals/insights")

    expect(screen.getByTestId("insights-child")).toBeInTheDocument()
    expect(screen.queryByTestId("goals-child")).not.toBeInTheDocument()
  })

  it("renders the Projects child route at /goals/project", () => {
    renderLayout("/goals/project")

    expect(screen.getByTestId("projects-child")).toBeInTheDocument()
    expect(screen.queryByTestId("goals-child")).not.toBeInTheDocument()
  })

  // Tab navigation between Goals/Projects/Insights now lives in the shared app-shell header's
  // section-tabs row, not in GoalsLayout - see section-tabs.test.tsx.
  // Planning Settings now lives only on Overview (goals-page.test.tsx), not in this shared
  // layout - see goals-navigation spec's "Planning Settings is an Overview-only control".
  it("does not render a Planning Settings entry point itself", () => {
    renderLayout("/goals")

    expect(
      screen.queryByTestId("goals-planning-settings")
    ).not.toBeInTheDocument()
  })
})

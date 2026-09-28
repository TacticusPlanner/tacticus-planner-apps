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
        <Route element={<GoalsLayout />} path="/plan">
          <Route element={<div data-testid="goals-child" />} path="goals" />
          <Route
            element={<div data-testid="projects-child" />}
            path="projects"
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
  it("renders the Goals child route at /plan/goals, with the Goals tab active", () => {
    renderLayout("/plan/goals")

    expect(screen.getByTestId("goals-child")).toBeInTheDocument()
    expect(screen.queryByTestId("insights-child")).not.toBeInTheDocument()
  })

  it("renders the Insights child route at /plan/insights, with the Insights tab active", () => {
    renderLayout("/plan/insights")

    expect(screen.getByTestId("insights-child")).toBeInTheDocument()
    expect(screen.queryByTestId("goals-child")).not.toBeInTheDocument()
  })

  it("renders the Projects child route at /plan/projects", () => {
    renderLayout("/plan/projects")

    expect(screen.getByTestId("projects-child")).toBeInTheDocument()
    expect(screen.queryByTestId("goals-child")).not.toBeInTheDocument()
  })

  // Tab navigation between Goals/Projects/Insights now lives in the shared app-shell header's
  // section-tabs row, not in GoalsLayout - see section-tabs.test.tsx.
  // Planning Settings now lives only on Overview (goals-page.test.tsx), not in this shared
  // layout - see goals-navigation spec's "Planning Settings is an Overview-only control".
  it("does not render a Planning Settings entry point itself", () => {
    renderLayout("/plan/goals")

    expect(
      screen.queryByTestId("goals-planning-settings")
    ).not.toBeInTheDocument()
  })
})

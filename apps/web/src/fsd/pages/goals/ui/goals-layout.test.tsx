import type { ReactNode } from "react"
import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string }) =>
      opts?.defaultValue ?? key,
  }),
}))

vi.mock("@/entities/planning-setting", () => ({
  PlanningSettingsProvider: ({ children }: { children: ReactNode }) => children,
  dailyEnergyTiers: [288, 378, 438, 538, 638, 738, 838, 938],
  usePlanningSettings: () => ({
    settings: { dailyEnergy: 288, revision: 1 },
    save: vi.fn(),
  }),
}))

vi.mock("@/shared/api", () => ({
  ApiError: class ApiError extends Error {},
}))

import { GoalsLayout } from "./goals-layout"

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

  it("renders and navigates to Projects between Goals and Insights", async () => {
    const user = userEvent.setup()
    renderLayout("/goals")

    const tabs = screen.getAllByRole("tab")
    expect(tabs.map((tab) => tab.textContent)).toEqual([
      "goals.tabs.goals",
      "goals.tabs.projects",
      "goals.tabs.insights",
    ])

    await user.click(screen.getByTestId("goals-layout-tab-project"))
    expect(screen.getByTestId("projects-child")).toBeInTheDocument()
  })

  it("navigates to the Insights route when the Insights tab is clicked", async () => {
    const user = userEvent.setup()
    renderLayout("/goals")

    await user.click(screen.getByTestId("goals-layout-tab-insights"))

    expect(screen.getByTestId("insights-child")).toBeInTheDocument()
  })
})

import { render, screen } from "@/test/render"
import { describe, expect, it, vi } from "vitest"

vi.mock("react-i18next", () => ({
  initReactI18next: { type: "3rdParty", init: vi.fn() },
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts ? `${key}:${JSON.stringify(opts)}` : key,
    i18n: { resolvedLanguage: "en" },
  }),
}))

import { GoalEstimateSection } from "./goal-estimate-section"

const estimated = {
  days: 22,
  date: "2026-10-11",
  energyTotal: 500,
  raidsTotal: 50,
}

describe("GoalEstimateSection", () => {
  it("shows the same date and day count the Goals list row shows", () => {
    render(<GoalEstimateSection estimate={estimated} isolated={false} />)

    // `EstimateCell`'s own cell, rendered verbatim — "Oct 11" formatted in UTC, then the day count.
    const cell = screen.getByTestId("goal-row-estimate")
    expect(cell).toHaveTextContent("Oct 11")
    expect(cell).toHaveTextContent('goals.estimate.days:{"days":22}')
  })

  it("labels a project-estimated figure as plan-aware", () => {
    render(<GoalEstimateSection estimate={estimated} isolated={false} />)

    expect(screen.getByText("goals.detail.planAwareEstimate")).toBeVisible()
    expect(screen.queryByText("goals.detail.isolatedEstimate")).toBeNull()
  })

  it("labels a singly-estimated figure as isolated", () => {
    render(<GoalEstimateSection estimate={estimated} isolated />)

    expect(screen.getByText("goals.detail.isolatedEstimate")).toBeVisible()
    expect(screen.queryByText("goals.detail.planAwareEstimate")).toBeNull()
  })

  it("shows a blocked reason with no date and neither framing label", () => {
    render(
      <GoalEstimateSection
        estimate={{
          status: "Blocked",
          reason: "NoFarmLocation",
          resourceIds: [],
        }}
        isolated
      />
    )

    expect(
      screen.getByText("goals.estimate.blocked.NoFarmLocation")
    ).toBeVisible()
    expect(screen.queryByTestId("goal-row-estimate")).toBeNull()
    expect(screen.queryByText("goals.detail.isolatedEstimate")).toBeNull()
    expect(screen.queryByText("goals.detail.planAwareEstimate")).toBeNull()
  })

  it("shows the unavailable text with no date and neither framing label", () => {
    render(<GoalEstimateSection estimate={undefined} isolated />)

    expect(screen.getByText("goals.detail.unavailable")).toBeVisible()
    expect(screen.queryByTestId("goal-row-estimate")).toBeNull()
    expect(screen.queryByText("goals.detail.isolatedEstimate")).toBeNull()
    expect(screen.queryByText("goals.detail.planAwareEstimate")).toBeNull()
  })
})

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

import { InsightsSummary } from "./insights-summary"

const baseProps = {
  totals: { upgradesByRarity: {}, orbsByType: {}, shards: 0, mythicShards: 0 },
  energyTotal: 0,
  onslaughtTokens: 0,
  onslaughtDays: 0,
  bottlenecks: [],
}

describe("InsightsSummary completion outlook", () => {
  it("shows a localized date and no caveat when every goal is estimated", () => {
    render(
      <InsightsSummary
        {...baseProps}
        completionDate="2026-10-11"
        unestimatedGoalCount={0}
      />
    )

    expect(screen.getByTestId("insights-completion-date")).toHaveTextContent(
      "Oct 11"
    )
    expect(
      screen.queryByTestId("insights-completion-excluded")
    ).not.toBeInTheDocument()
  })

  it("shows the caveat alongside a date derived from only some goals", () => {
    render(
      <InsightsSummary
        {...baseProps}
        completionDate="2026-10-11"
        unestimatedGoalCount={1}
      />
    )

    expect(screen.getByTestId("insights-completion-date")).toHaveTextContent(
      "Oct 11"
    )
    expect(
      screen.getByTestId("insights-completion-excluded")
    ).toHaveTextContent('goals.insights.completionExcluded:{"count":1}')
  })

  it("keeps its unknown placeholder, with the caveat, when nothing is estimable", () => {
    render(
      <InsightsSummary
        {...baseProps}
        completionDate={null}
        unestimatedGoalCount={7}
      />
    )

    // Insights is the one surface of the three that has a placeholder (design Decision 5).
    expect(screen.getByTestId("insights-completion-date")).toHaveTextContent(
      "goals.insights.completionUnknown"
    )
    expect(
      screen.getByTestId("insights-completion-excluded")
    ).toHaveTextContent('goals.insights.completionExcluded:{"count":7}')
  })
})

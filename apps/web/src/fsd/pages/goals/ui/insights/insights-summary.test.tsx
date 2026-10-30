import { render, screen } from "@/test/render"
import { describe, expect, it } from "vitest"
import { upgradeIdSchema } from "@workspace/game-domain"

import { InsightsSummary } from "./insights-summary"

const baseProps = {
  totals: { upgradesByRarity: {}, shards: 0, mythicShards: 0 },
  energyTotal: 0,
  onslaughtTokens: 0,
  onslaughtDays: 0,
  bottlenecks: [],
  blockers: [],
  dailyEnergy: 288,
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
    ).toHaveTextContent("1 goal not included in this date")
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
      "—"
    )
    expect(
      screen.getByTestId("insights-completion-excluded")
    ).toHaveTextContent("7 goals not included in this date")
  })
})

describe("InsightsSummary bottlenecks", () => {
  it("lists what can't be farmed before the farmable bottlenecks, with days", () => {
    render(
      <InsightsSummary
        {...baseProps}
        blockers={[
          {
            key: "NoFarmLocation:mat1",
            reason: "NoFarmLocation",
            resourceId: upgradeIdSchema.parse("mat1"),
            label: "Material One",
            remaining: 3,
            goalIds: ["goal-1"],
          },
        ]}
        bottlenecks={[
          {
            id: upgradeIdSchema.parse("mat2"),
            label: "Material Two",
            count: 12,
            energyToClear: 600,
            days: 600 / 288,
            goalIds: ["goal-1"],
          },
        ]}
        completionDate={null}
        energyTotal={600}
        unestimatedGoalCount={0}
      />
    )

    const blockers = screen.getByRole("list", { name: "Can't be farmed" })
    expect(blockers).toHaveTextContent("Material One")
    expect(blockers).toHaveTextContent(
      "No accessible farming location provides a required resource."
    )
    expect(screen.getByRole("list", { name: "Bottlenecks" })).toHaveTextContent(
      "Material Two ×12600·3 days"
    )
    expect(screen.getByTestId("insights-energy-days")).toHaveTextContent(
      "3 days"
    )
  })
})

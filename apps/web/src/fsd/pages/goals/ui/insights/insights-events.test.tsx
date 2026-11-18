import userEvent from "@testing-library/user-event"
import { render, screen } from "@/test/render"
import { describe, expect, it } from "vitest"
import {
  battleIdSchema,
  campaignIdSchema,
  upgradeIdSchema,
} from "@workspace/game-domain"

import { InsightsEvents } from "./insights-events"

const insight = {
  id: "campaign1:Normal",
  label: "Campaign One",
  score: 1.23,
  contributions: [
    {
      upgradeId: upgradeIdSchema.parse("mat1"),
      battleId: battleIdSchema.parse("B1"),
      campaignGroupId: campaignIdSchema.parse("campaign1"),
      type: "Normal",
      challenge: false,
      nodeNumber: 1,
      count: 2,
      dropRate: 1,
      value: 2,
    },
  ],
}

describe("InsightsEvents", () => {
  it("summarises each campaign in materials and days, and links the goals it helps", async () => {
    render(
      <InsightsEvents
        benefitingGoalIdsByInsightId={new Map([[insight.id, ["g1"]]])}
        farmingSpotsByInsightId={
          new Map([
            [
              insight.id,
              {
                resourceCount: 2,
                energy: 600,
                days: 2.1,
                itemCount: 40,
                coverage: 0.25,
              },
            ],
          ])
        }
        goalInfoById={
          new Map([
            [
              "g1",
              { entityType: "Character", entityId: "unit-a", goalType: "Rank" },
            ],
          ])
        }
        insights={[insight]}
        title="Best campaigns to farm"
      />,
      { route: "/plan/insights" }
    )

    expect(screen.getByTestId("insights-farming-spot")).toHaveTextContent(
      "25% of needs·15/item"
    )
    expect(screen.queryByText("1.23")).not.toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: "Day-by-day plan" })
    ).toHaveAttribute("href", "/plan/schedule")

    await userEvent.click(screen.getByRole("button", { name: /Campaign One/ }))
    expect(
      screen.getByTestId("insights-farming-spot-detail")
    ).toHaveTextContent(
      "40 needed items across 2 resources · 600 energy · 3 days"
    )
    expect(screen.getByRole("link", { name: "unit-a · Rank" })).toHaveAttribute(
      "href",
      "/plan/goals?goal=g1"
    )
  })

  it("lists the top 3 and shows the rest on Show all", async () => {
    const insights = ["One", "Two", "Three", "Four", "Five"].map(
      (label, index) => ({
        ...insight,
        id: `campaign${index}:Normal`,
        label: `Campaign ${label}`,
      })
    )
    render(
      <InsightsEvents
        benefitingGoalIdsByInsightId={new Map()}
        farmingSpotsByInsightId={new Map()}
        goalInfoById={new Map()}
        insights={insights}
        title="Best campaigns to farm"
      />,
      { route: "/plan/insights" }
    )

    expect(screen.getByText("Campaign Three")).toBeInTheDocument()
    expect(screen.queryByText("Campaign Four")).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole("button", { name: "Show all (5)" }))
    expect(screen.getByText("Campaign Five")).toBeInTheDocument()

    await userEvent.click(screen.getByRole("button", { name: "Show less" }))
    expect(screen.queryByText("Campaign Four")).not.toBeInTheDocument()
  })

  it("says why an empty card is empty when given the text, and hides it otherwise", () => {
    const props = {
      benefitingGoalIdsByInsightId: new Map(),
      farmingSpotsByInsightId: new Map(),
      goalInfoById: new Map(),
      insights: [],
      title: "Best events to farm",
    }
    const { unmount } = render(<InsightsEvents {...props} />, {
      route: "/plan/insights",
    })
    expect(screen.queryByText("Best events to farm")).not.toBeInTheDocument()
    unmount()

    render(<InsightsEvents {...props} emptyText="Nothing reached yet." />, {
      route: "/plan/insights",
    })
    expect(screen.getByTestId("insights-events-empty")).toHaveTextContent(
      "Nothing reached yet."
    )
  })
})

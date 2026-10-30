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
          new Map([[insight.id, { resourceCount: 2, energy: 600, days: 2.1 }]])
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
      "2 resources · 3 days"
    )
    expect(screen.queryByText("1.23")).not.toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: "Day-by-day plan" })
    ).toHaveAttribute("href", "/plan/schedule")

    await userEvent.click(screen.getByRole("button", { name: /Campaign One/ }))
    expect(screen.getByRole("link", { name: "unit-a · Rank" })).toHaveAttribute(
      "href",
      "/plan/goals?goal=g1"
    )
  })
})

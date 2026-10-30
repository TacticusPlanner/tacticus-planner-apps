import { render, screen, within } from "@/test/render"
import { describe, expect, it } from "vitest"
import { upgradeIdSchema } from "@workspace/game-domain"

import { InsightsHoldingBack } from "./insights-holding-back"

const goalInfoById = new Map([
  ["g1", { entityType: "Character", entityId: "unit-a", goalType: "Rank" }],
  ["g2", { entityType: "Character", entityId: "unit-b", goalType: "Rank" }],
])

describe("InsightsHoldingBack", () => {
  it("lists blockers with the goals they stop, then bottlenecks with energy, days and units", () => {
    render(
      <InsightsHoldingBack
        blockers={[
          {
            key: "NoFarmLocation:mat1",
            reason: "NoFarmLocation",
            resourceId: upgradeIdSchema.parse("mat1"),
            label: "Material One",
            remaining: 3,
            goalIds: ["g1"],
          },
        ]}
        bottlenecks={[
          {
            id: upgradeIdSchema.parse("mat2"),
            label: "Material Two",
            count: 12,
            energyToClear: 600,
            days: 600 / 288,
            goalIds: ["g1", "g2"],
          },
        ]}
        goalInfoById={goalInfoById}
      />,
      { route: "/plan/insights" }
    )

    const blockers = screen.getByRole("list", { name: "Can't be farmed" })
    expect(blockers).toHaveTextContent("Material One ×3")
    expect(within(blockers).getByRole("link")).toHaveAttribute(
      "href",
      "/plan/goals?goal=g1"
    )

    const bottleneck = within(
      screen.getByRole("list", { name: "Bottlenecks" })
    ).getByTestId("insights-bottleneck")
    expect(bottleneck).toHaveTextContent("Material Two ×12")
    expect(bottleneck).toHaveTextContent("600·3 days")
    expect(bottleneck).toHaveTextContent("Needed for unit-a and unit-b")
  })

  it("says so when nothing holds the plan back", () => {
    render(
      <InsightsHoldingBack
        blockers={[]}
        bottlenecks={[]}
        goalInfoById={goalInfoById}
      />
    )

    expect(
      screen.getByText("Nothing is holding these goals back.")
    ).toBeInTheDocument()
  })
})

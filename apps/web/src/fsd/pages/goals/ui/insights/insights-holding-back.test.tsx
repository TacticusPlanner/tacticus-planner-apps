import { render, screen, within } from "@/test/render"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { upgradeIdSchema } from "@workspace/game-domain"

vi.mock(
  "@/features/goal-planning/model/unlock-paths/use-farm-unlock-paths",
  () => ({
    useFarmUnlockPaths: () => (resourceId: string) =>
      resourceId === "mat1"
        ? [
            {
              kind: "campaign",
              battleId: "elite2-22",
              battlesToGo: 8,
              prerequisiteBattles: 0,
              lockReasons: [],
              started: true,
              campaignName: "Fall of Cadia",
              difficultyLabel: "Elite",
              nodeLabel: "Elite 23",
            },
            {
              kind: "campaign",
              battleId: "elite3-4",
              battlesToGo: 3,
              prerequisiteBattles: 2,
              lockReasons: [],
              started: false,
              campaignName: "Octarius",
              difficultyLabel: "Elite",
              nodeLabel: "Elite 5",
            },
            {
              kind: "event",
              battleId: "event1-3",
              campaignName: "Death Guard",
              nodeLabel: "3",
            },
          ]
        : [],
  })
)

import { InsightsHoldingBack } from "./insights-holding-back"

const goalInfoById = new Map([
  ["g1", { entityType: "Character", entityId: "unit-a", goalType: "Rank" }],
  ["g2", { entityType: "Character", entityId: "unit-b", goalType: "Rank" }],
])

describe("InsightsHoldingBack", () => {
  it("lists blockers with the goals they stop, then bottlenecks with energy, days and units", async () => {
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
    // How to unblock it: the closest locked nodes, then a count of the rest.
    const unlocks = within(blockers).getByRole("list", { name: "Unlocks at" })
    expect(unlocks).toHaveTextContent(
      "Fall of Cadia Elite 23 · 8 battles to go"
    )
    expect(unlocks).toHaveTextContent(
      "Octarius Elite 5 · not started, 5 battles to go"
    )
    // The reason is said once for the section, not on each row.
    expect(blockers).not.toHaveTextContent("No accessible farming location")
    expect(
      screen.getByText(
        "No accessible farming location provides a required resource."
      )
    ).toBeInTheDocument()
    // The rest of the locations open in place.
    await userEvent.click(
      within(blockers).getByRole("button", { name: "+1 more location" })
    )
    expect(unlocks).toHaveTextContent(
      "Death Guard 3 · during the campaign event"
    )
    expect(
      within(blockers).getByRole("button", { name: "Show fewer" })
    ).toHaveAttribute("aria-expanded", "true")

    const bottleneck = within(
      screen.getByRole("list", { name: "Bottlenecks" })
    ).getByTestId("insights-bottleneck")
    expect(bottleneck).toHaveTextContent("Material Two ×12")
    expect(bottleneck).toHaveTextContent("600·3 days")
    const needs = within(bottleneck).getByRole("list", { name: "Needed for" })
    expect(
      within(needs)
        .getAllByRole("link")
        .map((link) => link.textContent)
    ).toEqual(["unit-a · Rank", "unit-b · Rank"])
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

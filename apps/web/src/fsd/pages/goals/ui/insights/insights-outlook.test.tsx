import { render, screen, within } from "@/test/render"
import { describe, expect, it } from "vitest"

import { InsightsOutlook } from "./insights-outlook"

const goalInfoById = new Map([
  ["late", { entityType: "Character", entityId: "unit-a", goalType: "Rank" }],
  [
    "early",
    { entityType: "Character", entityId: "unit-b", goalType: "Unlock" },
  ],
  [
    "stuck",
    { entityType: "Character", entityId: "unit-c", goalType: "Ascension" },
  ],
])

describe("InsightsOutlook", () => {
  it("leads with the date, then names the goals that set it and the ones it leaves out", () => {
    render(
      <InsightsOutlook
        completionDate="2026-10-11"
        dailyEnergy={288}
        energyTotal={1_440}
        excludedGoals={[{ goalId: "stuck", reason: "NoFarmLocation" }]}
        goalInfoById={goalInfoById}
        goalOutlook={[
          { goalId: "late", date: "2026-10-11", days: 5 },
          { goalId: "early", date: "2026-10-08", days: 2 },
        ]}
        onslaughtDays={2.2}
      />,
      { route: "/plan/insights" }
    )

    expect(screen.getByTestId("insights-completion-date")).toHaveTextContent(
      "Done by Oct 11"
    )
    expect(screen.getByTestId("insights-energy-summary")).toHaveTextContent(
      "1,440 energy at 288 a day"
    )
    expect(
      screen.getByText("Includes 3 days waiting for Onslaught tokens")
    ).toBeInTheDocument()

    const critical = screen.getByRole("list", { name: "Sets the date" })
    const links = within(critical).getAllByRole("link")
    expect(links.map((link) => link.textContent)).toEqual([
      "unit-a · Rank",
      "unit-b · Unlock",
    ])
    expect(links[0]).toHaveAttribute("href", "/plan/goals?goal=late")

    expect(
      screen.getByTestId("insights-completion-excluded")
    ).toHaveTextContent("1 goal not included in this date")
    const excluded = screen.getByRole("list", {
      name: "Goals not in this date",
    })
    expect(excluded).toHaveTextContent("unit-c · Ascension")
    expect(excluded).toHaveTextContent(
      "No accessible farming location provides a required resource."
    )
  })

  it("says there is no date yet when nothing can be estimated", () => {
    render(
      <InsightsOutlook
        completionDate={null}
        dailyEnergy={288}
        energyTotal={0}
        excludedGoals={[{ goalId: "stuck", reason: "NotEstimated" }]}
        goalInfoById={goalInfoById}
        goalOutlook={[]}
        onslaughtDays={0}
      />,
      { route: "/plan/insights" }
    )

    expect(screen.getByTestId("insights-completion-date")).toHaveTextContent(
      "No completion date yet"
    )
    expect(
      screen.queryByRole("list", { name: "Sets the date" })
    ).not.toBeInTheDocument()
    expect(
      screen.getByText("Nothing left to farm, so there is no farming estimate.")
    ).toBeInTheDocument()
  })
})

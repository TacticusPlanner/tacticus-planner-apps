import userEvent from "@testing-library/user-event"
import { render, screen, within } from "@/test/render"
import { describe, expect, it } from "vitest"

import type { EstimateOutcome } from "@/features/goal-farming"
import { GoalCheckpoints } from "./goal-checkpoints"

const estimate: EstimateOutcome = {
  status: "Estimated",
  days: 5,
  date: "2026-01-05",
  energyTotal: 1500,
  raidsTotal: 30,
  checkpoints: [
    { target: "10", days: 0, date: "2026-01-01", energy: 0 },
    { target: "11", days: 2, date: "2026-01-02", energy: 600 },
    { target: "12", days: 5, date: "2026-01-05", energy: 900 },
  ],
}

describe("GoalCheckpoints", () => {
  it("summarises the checkpoints and lists each one's date and energy on demand", async () => {
    render(<GoalCheckpoints estimate={estimate} goalType="Rank" />)

    const trigger = screen.getByTestId("goal-checkpoints-trigger")
    expect(trigger).toHaveTextContent("3 checkpoints")
    expect(trigger).toHaveTextContent("Next")

    await userEvent.click(trigger)
    const rows = within(
      await screen.findByTestId("goal-checkpoints")
    ).getAllByTestId("goal-checkpoint")
    expect(rows).toHaveLength(3)
    expect(rows[0]).toHaveTextContent("Ready now")
    expect(rows[1]).toHaveTextContent("in 2 days")
    expect(rows[1]).toHaveTextContent("600 energy")
    expect(rows[2]).toHaveTextContent("900 energy")
  })

  it("renders nothing for a goal without checkpoints", () => {
    const { container } = render(
      <GoalCheckpoints
        estimate={{ ...estimate, checkpoints: undefined }}
        goalType="Rank"
      />
    )
    expect(container).toBeEmptyDOMElement()
  })
})

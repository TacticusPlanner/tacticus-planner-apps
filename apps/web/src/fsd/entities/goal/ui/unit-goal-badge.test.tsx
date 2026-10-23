import { describe, expect, it } from "vitest"

import { render, screen } from "@/test/render"

import { UnitGoalBadge } from "./unit-goal-badge"

describe("UnitGoalBadge", () => {
  it("names one goal", () => {
    render(<UnitGoalBadge label="Goals" lines={["Rank to Gold II"]} />)
    expect(
      screen.getByRole("button", { name: "Goals: Rank to Gold II" })
    ).toBeInTheDocument()
  })

  it("lists several goals", () => {
    render(
      <UnitGoalBadge
        label="Goals"
        lines={["Rank to Gold II", "Ascension to Legendary Red Three Stars"]}
      />
    )
    expect(
      screen.getByRole("button", {
        name: "Goals: Rank to Gold II; Ascension to Legendary Red Three Stars",
      })
    ).toBeInTheDocument()
  })

  it("renders nothing without goals", () => {
    render(<UnitGoalBadge label="Goals" lines={[]} />)
    expect(screen.queryByTestId("unit-goal-badge")).not.toBeInTheDocument()
  })

  it("is a plain titled mark without a tooltip", () => {
    render(<UnitGoalBadge label="Goals" lines={["Unlock"]} tooltip={false} />)
    const badge = screen.getByTestId("unit-goal-badge")
    expect(badge).toHaveAttribute("title", "Goals: Unlock")
    expect(badge).not.toHaveAttribute("tabindex")
  })
})

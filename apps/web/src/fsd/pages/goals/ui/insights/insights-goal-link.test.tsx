import { MemoryRouter } from "react-router"
import { describe, expect, it } from "vitest"

import { render, screen } from "@/test/render"
import { GoalLink } from "./insights-goal-link"

const label = { name: "Tigurius", goalType: "Rank" }
const info = { entityType: "Character", entityId: "ultraTigurius" }

describe("GoalLink", () => {
  it("leads with the goal's priority, as the Goals list numbers it", () => {
    render(
      <MemoryRouter>
        <GoalLink
          goalId="goal-3"
          info={{ ...info, goalType: "Rank", globalPriority: 3 }}
          label={label}
        />
      </MemoryRouter>
    )

    const link = screen.getByRole("link", { name: "#3 Tigurius · Rank" })
    expect(link).toHaveTextContent("#3Tigurius")
  })

  it("shows no number for a goal outside the priority order", () => {
    render(
      <MemoryRouter>
        <GoalLink
          goalId="goal-9"
          info={{ ...info, goalType: "Rank", globalPriority: null }}
          label={label}
        />
      </MemoryRouter>
    )

    expect(
      screen.getByRole("link", { name: "Tigurius · Rank" })
    ).toBeInTheDocument()
    expect(screen.queryByTestId("insights-goal-priority")).toBeNull()
  })
})

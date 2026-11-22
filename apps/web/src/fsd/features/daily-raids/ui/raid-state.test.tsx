import { describe, expect, it, vi } from "vitest"

import { CreateGoalLauncherContext } from "@/entities/goal"
import { fireEvent, render, screen } from "@/test/render"

import { RaidState } from "./raid-state"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

describe("RaidState", () => {
  it("shows the shared empty state when there are no goals", () => {
    render(<RaidState state="no-goals" />)

    const state = screen.getByRole("status")
    expect(state).toHaveAttribute("data-testid", "dailies-no-goals")
    expect(state).toHaveTextContent("empty.noGoals")
  })

  it("offers Create goal on no goals when the app can open the goal sheet", () => {
    const launch = vi.fn()
    render(
      <CreateGoalLauncherContext.Provider value={launch}>
        <RaidState state="no-goals" />
      </CreateGoalLauncherContext.Provider>
    )

    fireEvent.click(screen.getByRole("button", { name: "goals.createButton" }))
    expect(launch).toHaveBeenCalledOnce()
  })

  it("leaves Create goal out without a goal sheet to open, and on no farmable goals", () => {
    const view = render(<RaidState state="no-goals" />)
    expect(screen.queryByRole("button")).toBeNull()
    view.unmount()

    render(
      <CreateGoalLauncherContext.Provider value={vi.fn()}>
        <RaidState state="no-farmable" />
      </CreateGoalLauncherContext.Provider>
    )
    expect(screen.queryByRole("button")).toBeNull()
  })

  it("takes a page's own no-goals sentence", () => {
    render(<RaidState noGoalsMessage="Schedule copy" state="no-goals" />)

    expect(screen.getByRole("status")).toHaveTextContent("Schedule copy")
  })

  it("renders the same message and retry button without a card inline", () => {
    const onRetry = vi.fn()
    render(<RaidState onRetry={onRetry} state="error" variant="inline" />)

    const state = screen.getByTestId("dailies-error")
    expect(state).not.toHaveAttribute("data-slot", "card")
    expect(state.querySelector("[data-slot='card']")).toBeNull()
    expect(state).toHaveTextContent("empty.error")
    expect(
      screen.getByRole("button", { name: "empty.retry" })
    ).toBeInTheDocument()
  })
})

import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@/test/render"
import userEvent from "@testing-library/user-event"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

import { GoalFilters, GoalGroupBy } from "./goal-filters"

describe("GoalFilters", () => {
  it("keeps the Type filter's name stable and calls onGoalTypeChange", async () => {
    const user = userEvent.setup()
    const onGoalTypeChange = vi.fn()
    render(<GoalFilters goalType="all" onGoalTypeChange={onGoalTypeChange} />)

    const type = screen.getByTestId("goals-type-filter")
    expect(type).toHaveAccessibleName("goals.filters.typeFilterLabel")
    await user.click(type)
    await user.click(
      screen.getByRole("option", { name: "goals.create.goalTypes.Rank" })
    )
    expect(onGoalTypeChange).toHaveBeenCalledWith("Rank")
  })
})

describe("GoalGroupBy", () => {
  it("is the labelled Group by segmented control with every option by default", async () => {
    const user = userEvent.setup()
    const onGroupChange = vi.fn()
    render(<GoalGroupBy group="none" onGroupChange={onGroupChange} />)

    const group = screen.getByRole("radiogroup", {
      name: "pageToolbar.groupBy",
    })
    expect(group).toBeInTheDocument()
    expect(
      screen.getByRole("radio", { name: "goals.filters.groupOptions.none" })
    ).toBeChecked()
    for (const option of ["unit", "type"]) {
      expect(
        screen.getByRole("radio", {
          name: `goals.filters.groupOptions.${option}`,
        })
      ).not.toBeChecked()
    }

    await user.click(
      screen.getByRole("radio", { name: "goals.filters.groupOptions.unit" })
    )
    expect(onGroupChange).toHaveBeenCalledWith("unit")
  })

  it("ignores a press on the picked option (a grouping is always set)", async () => {
    const user = userEvent.setup()
    const onGroupChange = vi.fn()
    render(<GoalGroupBy group="type" onGroupChange={onGroupChange} />)

    await user.click(
      screen.getByRole("radio", { name: "goals.filters.groupOptions.type" })
    )
    expect(onGroupChange).not.toHaveBeenCalled()
  })

  it("restricts the options to groupOptions when supplied", () => {
    render(
      <GoalGroupBy
        group="none"
        groupOptions={["none", "type"]}
        onGroupChange={vi.fn()}
      />
    )

    expect(screen.getAllByRole("radio")).toHaveLength(2)
    expect(
      screen.queryByRole("radio", { name: "goals.filters.groupOptions.unit" })
    ).not.toBeInTheDocument()
  })
})

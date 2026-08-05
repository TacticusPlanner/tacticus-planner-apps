import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@/test/render"
import userEvent from "@testing-library/user-event"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

import { StatusFilterSelect } from "./status-filter-select"

const baseCounts = {
  toReach: 2,
  reached: 0,
  archived: 1,
  active: 2,
  paused: 0,
}

describe("StatusFilterSelect", () => {
  it("defaults to Unfulfilled and shows per-option counts", async () => {
    const user = userEvent.setup()
    render(
      <StatusFilterSelect
        counts={baseCounts}
        onValueChange={vi.fn()}
        value="toReach"
      />
    )

    expect(screen.getByTestId("goals-status-filter")).toHaveTextContent(
      "goals.tabs.toReach"
    )

    await user.click(screen.getByTestId("goals-status-filter"))
    expect(
      screen.getByRole("option", { name: "goals.tabs.reached (0)" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("option", { name: "goals.tabs.archived (1)" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("option", { name: "goals.tabs.active (2)" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("option", { name: "goals.tabs.paused (0)" })
    ).toBeInTheDocument()
  })

  it("shows the Blocked option without a count", async () => {
    const user = userEvent.setup()
    render(
      <StatusFilterSelect
        counts={baseCounts}
        onValueChange={vi.fn()}
        value="toReach"
      />
    )

    await user.click(screen.getByTestId("goals-status-filter"))
    expect(
      screen.getByRole("option", { name: "goals.tabs.blocked" })
    ).toBeInTheDocument()
  })

  it("calls onValueChange when a different status is selected", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <StatusFilterSelect
        counts={{ ...baseCounts, reached: 1 }}
        onValueChange={onValueChange}
        value="toReach"
      />
    )

    await user.click(screen.getByTestId("goals-status-filter"))
    await user.click(
      screen.getByRole("option", { name: "goals.tabs.reached (1)" })
    )

    expect(onValueChange).toHaveBeenCalledWith("reached")
  })

  it("calls onValueChange when Blocked is selected", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <StatusFilterSelect
        counts={baseCounts}
        onValueChange={onValueChange}
        value="toReach"
      />
    )

    await user.click(screen.getByTestId("goals-status-filter"))
    await user.click(screen.getByRole("option", { name: "goals.tabs.blocked" }))

    expect(onValueChange).toHaveBeenCalledWith("blocked")
  })

  it("shows the reached indicator when reached goals exist and aren't being viewed", () => {
    const { rerender } = render(
      <StatusFilterSelect
        counts={{ ...baseCounts, reached: 1 }}
        onValueChange={vi.fn()}
        value="toReach"
      />
    )
    expect(
      screen.getByTestId("goals-status-filter-reached-indicator")
    ).toBeInTheDocument()

    rerender(
      <StatusFilterSelect
        counts={{ ...baseCounts, reached: 1 }}
        onValueChange={vi.fn()}
        value="reached"
      />
    )
    expect(
      screen.queryByTestId("goals-status-filter-reached-indicator")
    ).not.toBeInTheDocument()
  })

  it("hides the reached indicator when there are no reached goals", () => {
    render(
      <StatusFilterSelect
        counts={baseCounts}
        onValueChange={vi.fn()}
        value="toReach"
      />
    )
    expect(
      screen.queryByTestId("goals-status-filter-reached-indicator")
    ).not.toBeInTheDocument()
  })

  it("supports a caller-provided testId for multiple instances on one page", () => {
    render(
      <StatusFilterSelect
        counts={{
          toReach: 0,
          reached: 0,
          archived: 0,
          active: 0,
          paused: 0,
        }}
        onValueChange={vi.fn()}
        testId="projects-status-filter"
        value="toReach"
      />
    )
    expect(screen.getByTestId("projects-status-filter")).toBeInTheDocument()
  })
})

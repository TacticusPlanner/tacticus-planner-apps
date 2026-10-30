import { describe, expect, it, vi } from "vitest"

import { render, screen } from "@/test/render"

import { RaidState } from "./raid-state"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

describe("RaidState", () => {
  it("wraps its message in a card by default", () => {
    render(<RaidState state="no-goals" />)

    const state = screen.getByTestId("dailies-no-goals")
    expect(state).toHaveAttribute("data-slot", "card")
    expect(state).toHaveTextContent("empty.noGoals")
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

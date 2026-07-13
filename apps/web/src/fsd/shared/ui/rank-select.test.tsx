import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

import { RankSelect } from "./rank-select"

describe("RankSelect", () => {
  it("shows the label and current value, and lists every option", () => {
    render(
      <RankSelect
        label="From"
        value="Stone1"
        options={["Stone1", "Stone2", "Iron1"]}
        onChange={vi.fn()}
      />
    )

    expect(screen.getByText("From")).toBeInTheDocument()
    expect(screen.getByRole("combobox")).toHaveTextContent("ranks.Stone1")

    fireEvent.click(screen.getByRole("combobox"))

    expect(
      screen.getAllByRole("option").map((option) => option.textContent)
    ).toEqual(["ranks.Stone1", "ranks.Stone2", "ranks.Iron1"])
  })

  it("calls onChange with the selected rank", () => {
    const onChange = vi.fn()
    render(
      <RankSelect
        label="From"
        value="Stone1"
        options={["Stone1", "Stone2", "Iron1"]}
        onChange={onChange}
      />
    )

    fireEvent.click(screen.getByRole("combobox"))
    fireEvent.click(screen.getByText("ranks.Iron1"))

    expect(onChange).toHaveBeenCalledWith("Iron1")
  })
})

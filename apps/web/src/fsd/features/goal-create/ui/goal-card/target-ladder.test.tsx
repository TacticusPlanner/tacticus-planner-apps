import { describe, expect, it, vi } from "vitest"
import userEvent from "@testing-library/user-event"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { render, screen, within } from "@/test/render"

import { rankLadderSteps } from "./ladder-steps"
import { TargetLadder } from "./target-ladder"

function RankLadder({
  start,
  initial,
  taken = [],
  onChange,
}: {
  start: string
  initial: string
  taken?: string[]
  onChange?: (key: string) => void
}) {
  const { t } = useTranslation()
  const [value, setValue] = useState(initial)
  return (
    <TargetLadder
      label="Target rank"
      onChange={(key) => {
        setValue(key)
        onChange?.(key)
      }}
      startKey={start}
      steps={rankLadderSteps(t)}
      takenKeys={new Set(taken)}
      testId="ladder"
      valueKey={value}
    />
  )
}

const radio = (name: string) =>
  within(screen.getByRole("radiogroup", { name: "Target rank" })).getByRole(
    "radio",
    { name }
  )

describe("TargetLadder", () => {
  it("marks Incisus' Current step, the taken steps, the selection and the range between", () => {
    render(
      <RankLadder
        initial="Diamond2"
        start="Gold2"
        taken={["Gold3", "Diamond1"]}
      />
    )

    expect(radio("Gold II, Current")).toHaveAttribute("aria-disabled", "true")
    expect(radio("Silver III")).toHaveAttribute("aria-disabled", "true")
    expect(radio("Gold III, Already a goal")).toHaveAttribute(
      "aria-disabled",
      "true"
    )
    expect(radio("Diamond I, Already a goal")).toHaveAttribute(
      "aria-disabled",
      "true"
    )
    expect(radio("Diamond II")).toHaveAttribute("aria-checked", "true")
    expect(radio("Diamond III")).not.toHaveAttribute("aria-disabled")

    const inRange = screen
      .getAllByRole("radio")
      .filter((step) => step.hasAttribute("data-in-range"))
      .map((step) => step.getAttribute("data-step"))
    expect(inRange).toEqual(["Gold2", "Gold3", "Diamond1", "Diamond2"])
  })

  it("ignores a click on a step that can't be chosen", async () => {
    const onChange = vi.fn()
    render(
      <RankLadder
        initial="Diamond2"
        onChange={onChange}
        start="Gold2"
        taken={["Gold3"]}
      />
    )

    await userEvent.click(radio("Gold III, Already a goal"))
    await userEvent.click(radio("Silver I"))
    expect(onChange).not.toHaveBeenCalled()
  })

  it("moves with the arrow keys between choosable steps and selects with Enter", async () => {
    const user = userEvent.setup()
    render(<RankLadder initial="Diamond2" start="Gold2" taken={["Gold3"]} />)

    // One tab stop: the selected step.
    await user.tab()
    expect(radio("Diamond II")).toHaveFocus()
    await user.keyboard("{ArrowRight}{Enter}")
    expect(radio("Diamond III")).toHaveAttribute("aria-checked", "true")

    // Back past the taken Gold III, which arrows skip.
    await user.keyboard("{ArrowLeft}{ArrowLeft}{ArrowLeft}")
    expect(radio("Diamond I")).toHaveFocus()
    await user.keyboard("{ArrowLeft}")
    expect(radio("Diamond I")).toHaveFocus()
    await user.keyboard(" ")
    expect(radio("Diamond I")).toHaveAttribute("aria-checked", "true")
  })

  it("shows a stored target below the start as selected, but not choosable", () => {
    render(<RankLadder initial="Silver1" start="Gold2" />)

    expect(radio("Silver I")).toHaveAttribute("aria-checked", "true")
    expect(radio("Silver I")).toHaveAttribute("aria-disabled", "true")
    // The tab stop moves to the first step that can be chosen.
    expect(radio("Gold III")).toHaveAttribute("tabindex", "0")
  })
})

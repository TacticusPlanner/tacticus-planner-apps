import { useState } from "react"
import { describe, expect, it, vi } from "vitest"

import { fireEvent, render, screen } from "@/test/render"

import { NumberStepper } from "./number-stepper"

const labels = {
  value: "Depth",
  decrease: "Decrease",
  increase: "Increase",
  clear: "Clear",
}

function Harness({
  initial,
  onChange,
}: {
  initial: number | null
  onChange?: (value: number | null) => void
}) {
  const [value, setValue] = useState(initial)
  return (
    <NumberStepper
      clearable
      labels={labels}
      max={5}
      min={1}
      onChange={(next) => {
        setValue(next)
        onChange?.(next)
      }}
      value={value}
    />
  )
}

const input = () => screen.getByTestId("number-stepper-input")

describe("NumberStepper", () => {
  it("starts an empty stepper at min and steps within the bounds", () => {
    render(<Harness initial={null} />)
    expect(input()).toHaveValue(null)
    expect(screen.getByTestId("number-stepper-decrease")).toBeDisabled()

    fireEvent.click(screen.getByTestId("number-stepper-increase"))
    expect(input()).toHaveValue(1)
    for (let press = 0; press < 4; press++) {
      fireEvent.click(screen.getByTestId("number-stepper-increase"))
    }
    expect(input()).toHaveValue(5)
    expect(screen.getByTestId("number-stepper-increase")).toBeDisabled()
    fireEvent.click(screen.getByTestId("number-stepper-decrease"))
    expect(input()).toHaveValue(4)
  })

  it("clamps a typed entry on blur", () => {
    const onChange = vi.fn()
    render(<Harness initial={2} onChange={onChange} />)
    fireEvent.focus(input())
    fireEvent.change(input(), { target: { value: "42" } })
    fireEvent.blur(input())
    expect(onChange).toHaveBeenLastCalledWith(5)
    expect(input()).toHaveValue(5)
  })

  it("clears to null with the clear control and with an emptied input", () => {
    const onChange = vi.fn()
    render(<Harness initial={3} onChange={onChange} />)
    fireEvent.click(screen.getByRole("button", { name: "Clear" }))
    expect(onChange).toHaveBeenLastCalledWith(null)
    expect(input()).toHaveValue(null)
    expect(screen.queryByTestId("number-stepper-clear")).toBeNull()

    fireEvent.click(screen.getByTestId("number-stepper-increase"))
    fireEvent.focus(input())
    fireEvent.change(input(), { target: { value: "" } })
    fireEvent.keyDown(input(), { key: "Enter" })
    expect(onChange).toHaveBeenLastCalledWith(null)
  })
})

import { render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { Progress } from "./progress"

describe("Progress", () => {
  afterEach(() => vi.restoreAllMocks())

  it.each([
    [150, "100"],
    [-20, "0"],
  ])(
    "clamps %s into range so Radix keeps the value and logs no error",
    (value, expected) => {
      const error = vi.spyOn(console, "error").mockImplementation(() => {})
      render(<Progress aria-label="Energy" value={value} />)

      const bar = screen.getByRole("progressbar", { name: "Energy" })
      expect(bar).toHaveAttribute("aria-valuenow", expected)
      expect(bar).not.toHaveAttribute("data-state", "indeterminate")
      expect(error).not.toHaveBeenCalled()
    }
  )

  it("clamps to a custom max", () => {
    render(<Progress aria-label="Energy" max={10} value={12} />)

    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "10"
    )
  })

  it("treats NaN as indeterminate without an error", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {})
    render(<Progress aria-label="Energy" value={Number.NaN} />)

    expect(screen.getByRole("progressbar")).not.toHaveAttribute("aria-valuenow")
    expect(error).not.toHaveBeenCalled()
  })
})

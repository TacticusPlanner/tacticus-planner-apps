import { createRef } from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { ColorPicker } from "./color-picker"

describe("ColorPicker", () => {
  it("opens with a swatch and emits only valid manual hex values", async () => {
    const onChange = vi.fn()
    render(
      <ColorPicker
        aria-label="Custom color"
        onChange={onChange}
        value="#112233"
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "Custom color" }))
    const input = await screen.findByRole("textbox", { name: "Custom color" })

    fireEvent.change(input, { target: { value: "#bad" } })
    expect(input).toHaveAttribute("aria-invalid", "true")
    expect(onChange).not.toHaveBeenCalled()
    fireEvent.blur(input)
    expect(input).toHaveValue("#112233")
    expect(input).toHaveAttribute("aria-invalid", "false")

    fireEvent.change(input, { target: { value: "#AABBCC" } })
    expect(input).toHaveAttribute("aria-invalid", "false")
    expect(onChange).toHaveBeenLastCalledWith("#aabbcc")
  })

  it("forwards the input ref and blur/name properties", async () => {
    const inputRef = createRef<HTMLInputElement>()
    const onBlur = vi.fn()
    render(
      <ColorPicker
        aria-label="Custom color"
        name="project-color"
        onBlur={onBlur}
        onChange={vi.fn()}
        ref={inputRef}
        value="#123456"
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "Custom color" }))
    const input = await screen.findByRole("textbox", { name: "Custom color" })
    expect(inputRef.current).toBe(input)
    expect(input).toHaveAttribute("name", "project-color")
    fireEvent.blur(input)
    expect(onBlur).toHaveBeenCalledOnce()
  })

  it("cannot be opened while disabled", async () => {
    render(
      <ColorPicker
        aria-label="Custom color"
        disabled
        onChange={vi.fn()}
        value="#123456"
      />
    )

    expect(screen.getByRole("button", { name: "Custom color" })).toBeDisabled()
    await waitFor(() =>
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument()
    )
  })
})

import { render, screen, waitFor } from "@/test/render"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { HintTrigger } from "./hint-trigger"

afterEach(() => {
  vi.unstubAllGlobals()
})

const stubPointer = (coarse: boolean) =>
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: coarse && query === "(pointer: coarse)",
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }))

describe("HintTrigger", () => {
  it("is a focusable button named by its label, with no native title", () => {
    render(<HintTrigger label="Energy: 1,674">1,674</HintTrigger>)
    const trigger = screen.getByRole("button", { name: "Energy: 1,674" })
    expect(trigger).not.toHaveAttribute("title")
  })

  it("shows its hint as a tooltip with a mouse", async () => {
    stubPointer(false)
    render(<HintTrigger label="Energy: 1,674">1,674</HintTrigger>)
    await userEvent.hover(screen.getByRole("button"))
    expect(
      (await screen.findAllByText("Energy: 1,674")).length
    ).toBeGreaterThan(0)
  })

  it("opens its hint in a popover on tap with a coarse pointer", async () => {
    stubPointer(true)
    render(
      <HintTrigger hint="Held by #2 Z'Kar" label="Mat: 3 / 10">
        3/10
      </HintTrigger>
    )
    await userEvent.click(screen.getByRole("button"))
    expect(await screen.findByRole("dialog")).toHaveTextContent(
      "Held by #2 Z'Kar"
    )
  })

  it("opens from the keyboard and closes on Escape with a mouse", async () => {
    stubPointer(false)
    const user = userEvent.setup()
    render(<HintTrigger label="Energy: 1,674">1,674</HintTrigger>)
    await user.tab()
    expect(screen.getByRole("button")).toHaveFocus()
    expect(await screen.findByRole("tooltip")).toHaveTextContent(
      "Energy: 1,674"
    )
    await user.keyboard("{Escape}")
    await waitFor(() => expect(screen.queryByRole("tooltip")).toBeNull())
  })

  it("opens from the keyboard, closes on Escape and reopens with a coarse pointer", async () => {
    stubPointer(true)
    const user = userEvent.setup()
    render(
      <HintTrigger hint="Held by #2 Z'Kar" label="Mat: 3 / 10">
        3/10
      </HintTrigger>
    )
    await user.tab()
    expect(screen.getByRole("button")).toHaveFocus()
    await user.keyboard("{Enter}")
    expect(await screen.findByRole("dialog")).toHaveTextContent(
      "Held by #2 Z'Kar"
    )
    await user.keyboard("{Escape}")
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
    await user.click(screen.getByRole("button"))
    expect(await screen.findByRole("dialog")).toBeInTheDocument()
  })
})

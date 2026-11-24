import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { fireEvent, render, screen } from "@/test/render"

import { TruncatedText } from "./truncated-text"

const NAME = "Ultramarines and friends for the Tyranid mythic boss"

/** jsdom lays nothing out: fake the span being cut off (or not). */
function setCut(element: HTMLElement, cut: boolean) {
  Object.defineProperty(element, "clientWidth", {
    configurable: true,
    value: 100,
  })
  Object.defineProperty(element, "scrollWidth", {
    configurable: true,
    value: cut ? 300 : 100,
  })
}

describe("TruncatedText", () => {
  it("shows the full text on hover only while it is cut off", async () => {
    render(<TruncatedText data-testid="name">{NAME}</TruncatedText>)
    const text = screen.getByTestId("name")

    setCut(text, false)
    await userEvent.hover(text)
    expect(screen.queryByRole("tooltip")).toBeNull()
    await userEvent.unhover(text)

    setCut(text, true)
    await userEvent.hover(text)
    expect(screen.getByRole("tooltip")).toHaveTextContent(NAME)
  })

  it("toggles on a touch tap when cut off and standing alone", () => {
    render(<TruncatedText data-testid="name">{NAME}</TruncatedText>)
    const text = screen.getByTestId("name")
    setCut(text, true)

    fireEvent.pointerDown(text, { pointerType: "touch" })
    fireEvent.click(text)
    expect(screen.getByRole("tooltip")).toHaveTextContent(NAME)

    fireEvent.pointerDown(text, { pointerType: "touch" })
    fireEvent.click(text)
    expect(screen.queryByRole("tooltip")).toBeNull()
  })

  it("leaves a tap inside a link to the link", () => {
    render(
      <a href="/teams/1">
        <TruncatedText data-testid="name">{NAME}</TruncatedText>
      </a>
    )
    const text = screen.getByTestId("name")
    setCut(text, true)

    fireEvent.pointerDown(text, { pointerType: "touch" })
    const click = fireEvent.click(text)
    expect(click).toBe(true)
    expect(screen.queryByRole("tooltip")).toBeNull()
  })
})

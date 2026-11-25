import { describe, expect, it } from "vitest"

import { render, screen } from "@/test/render"

import { UnitPortrait } from "./unit-portrait"

const src =
  "/game_catalog/datamines/atlases/ui_image_RoundPortrait_losta_fearmonger_01.webp"

describe("UnitPortrait", () => {
  it("draws the portrait at its scale size with a rarity ring", () => {
    render(<UnitPortrait src={src} size="portrait-md" rarity="Epic" />)

    const portrait = screen.getByTestId("unit-portrait")
    expect(portrait).toHaveClass("size-portrait-md", "border-3")
    expect(portrait.getAttribute("style")).toContain("var(--rarity-epic)")
    expect(portrait).not.toHaveAttribute("data-greyed")
  })

  it("uses a thin ring on the small size and a thick one on the xl size", () => {
    const { rerender } = render(<UnitPortrait src={src} size="portrait-sm" />)
    expect(screen.getByTestId("unit-portrait")).toHaveClass(
      "size-portrait-sm",
      "border-2"
    )

    rerender(<UnitPortrait src={src} size="portrait-xl" />)
    expect(screen.getByTestId("unit-portrait")).toHaveClass(
      "size-portrait-xl",
      "border-4"
    )
  })

  it("greys out a unit the player has not unlocked", () => {
    render(<UnitPortrait src={src} size="portrait-lg" rarity="Epic" greyed />)

    const portrait = screen.getByTestId("unit-portrait")
    expect(portrait).toHaveAttribute("data-greyed", "true")
    expect(portrait).toHaveClass("border-dashed", "grayscale")
    // The dashed ring keeps the rarity colour, so a locked unit still shows its rarity.
    expect(portrait.style.borderColor).not.toBe("")
  })

  it("names the unit when given alt text", () => {
    render(<UnitPortrait src={src} size="portrait-sm" alt="Losta" />)
    expect(screen.getByRole("img", { name: "Losta" })).toBeInTheDocument()
  })
})

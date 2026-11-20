import { describe, expect, it } from "vitest"

import { render, screen } from "@/test/render"

import { UnitPortrait } from "./unit-portrait"

const src =
  "/game_catalog/datamines/atlases/ui_image_RoundPortrait_losta_fearmonger_01.webp"

describe("UnitPortrait", () => {
  it("draws the portrait at its scale size with a rarity ring", () => {
    render(<UnitPortrait src={src} size="md" rarity="Epic" />)

    const portrait = screen.getByTestId("unit-portrait")
    expect(portrait).toHaveClass("size-16", "border-3")
    expect(portrait.getAttribute("style")).toContain("var(--rarity-epic)")
    expect(portrait).not.toHaveAttribute("data-greyed")
  })

  it("uses a thin ring on the small size and a thick one on the hero size", () => {
    const { rerender } = render(<UnitPortrait src={src} size="sm" />)
    expect(screen.getByTestId("unit-portrait")).toHaveClass(
      "size-10",
      "border-2"
    )

    rerender(<UnitPortrait src={src} size="hero" />)
    expect(screen.getByTestId("unit-portrait")).toHaveClass(
      "size-32",
      "border-4"
    )
  })

  it("greys out a unit the player has not unlocked", () => {
    render(<UnitPortrait src={src} size="lg" rarity="Epic" greyed />)

    const portrait = screen.getByTestId("unit-portrait")
    expect(portrait).toHaveAttribute("data-greyed", "true")
    expect(portrait).toHaveClass("border-dashed", "grayscale")
    expect(portrait.style.borderColor).toBe("")
  })

  it("names the unit when given alt text", () => {
    render(<UnitPortrait src={src} size="sm" alt="Losta" />)
    expect(screen.getByRole("img", { name: "Losta" })).toBeInTheDocument()
  })
})

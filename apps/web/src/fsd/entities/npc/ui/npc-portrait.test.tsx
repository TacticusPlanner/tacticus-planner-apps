import { describe, expect, it } from "vitest"

import { fireEvent, render, screen } from "@/test/render"

import { NpcPortrait } from "./npc-portrait"

describe("NpcPortrait", () => {
  it("renders the mapped portrait image for a known variation id", () => {
    render(<NpcPortrait variationId="necroBossWarden" name="Makhotep" />)

    const img = screen.getByRole("img", { name: "Makhotep" })
    expect(img).toHaveAttribute(
      "src",
      "/game_catalog/characters/ui_image_portrait_necro_warden_01.png"
    )
  })

  it("renders an initials badge when no portrait is mapped", () => {
    render(<NpcPortrait variationId="notAnNpc" name="Winged Prime" />)

    expect(screen.queryByRole("img")).toBeNull()
    expect(screen.getByTestId("npc-portrait")).toHaveAttribute(
      "data-fallback",
      "initials"
    )
    expect(screen.getByText("WP")).toBeInTheDocument()
  })

  it("falls back to initials when the mapped image fails to load", () => {
    render(<NpcPortrait variationId="necroBossWarden" name="Makhotep" />)

    fireEvent.error(screen.getByRole("img", { name: "Makhotep" }))

    expect(screen.queryByRole("img")).toBeNull()
    expect(screen.getByText("M")).toBeInTheDocument()
  })
})

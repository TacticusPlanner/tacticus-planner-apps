import { fireEvent } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { render, screen } from "@/test/render"

import { EntityIcon } from "./entity-icon"

const portrait =
  "/game_catalog/datamines/atlases/ui_image_RoundPortrait_losta_fearmonger_01.webp"

describe("EntityIcon", () => {
  it("renders nothing when the entity has no icon at all", () => {
    const { container } = render(<EntityIcon alt="Daras" />)
    expect(container).toBeEmptyDOMElement()
  })

  it("swaps a missing unit portrait for a unit placeholder of the same size", () => {
    render(<EntityIcon alt="Daras" className="size-12" src={portrait} />)
    fireEvent.error(screen.getByRole("img", { name: "Daras" }))

    const placeholder = screen.getByRole("img", { name: "Daras" })
    expect(placeholder.tagName).toBe("SPAN")
    expect(placeholder).toHaveAttribute("data-icon-placeholder", "unit")
    expect(placeholder).toHaveClass("size-12", "rounded-full")
  })

  it("prefers the fallback image over a placeholder", () => {
    render(
      <EntityIcon
        alt="Item"
        fallback="/fallback.webp"
        src="/game_catalog/datamines/items/ui_icon_item_I_Block_C005.webp"
      />
    )
    fireEvent.error(screen.getByRole("img", { name: "Item" }))
    expect(screen.getByRole("img", { name: "Item" })).toHaveAttribute(
      "src",
      "/fallback.webp"
    )
  })

  it("keeps a decorative placeholder out of the accessibility tree", () => {
    const { container } = render(
      <EntityIcon
        alt=""
        src="/game_catalog/datamines/abilities/ui_icon_ability2_X.webp"
      />
    )
    fireEvent.error(container.querySelector("img")!)
    const placeholder = container.querySelector("[data-icon-placeholder]")
    expect(placeholder).toHaveAttribute("data-icon-placeholder", "ability")
    expect(placeholder).toHaveAttribute("aria-hidden", "true")
  })
})

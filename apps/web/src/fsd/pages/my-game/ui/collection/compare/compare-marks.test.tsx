import { describe, expect, it } from "vitest"

import { render } from "@/test/render"

import { ProgressionMark } from "./compare-marks"

// The rarity icon is the mark's first child, the star half the `data-part="stars"` span.
function halves(container: HTMLElement) {
  const mark = container.firstElementChild!
  return {
    rarity: mark.firstElementChild!,
    stars: mark.querySelector('[data-part="stars"]'),
  }
}

describe("ProgressionMark", () => {
  it("fades the stars for ascensions and the rarity for promotions", () => {
    const ascension = halves(
      render(<ProgressionMark value="Mythic:TwoBlueStars" emphasis="rarity" />)
        .container
    )
    expect(ascension.stars).toHaveClass("opacity-35")
    expect(ascension.rarity).not.toHaveClass("opacity-35")

    const promotion = halves(
      render(<ProgressionMark value="Mythic:TwoBlueStars" emphasis="stars" />)
        .container
    )
    expect(promotion.rarity).toHaveClass("opacity-35")
    expect(promotion.stars).not.toHaveClass("opacity-35")
  })

  it("renders no star half when there are no stars", () => {
    const { stars } = halves(
      render(<ProgressionMark value="Common:None" emphasis="rarity" />)
        .container
    )
    expect(stars).toBeNull()
  })
})

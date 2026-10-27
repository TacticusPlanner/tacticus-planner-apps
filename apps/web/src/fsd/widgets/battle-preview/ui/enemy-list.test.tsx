import { describe, expect, it } from "vitest"

import { render, screen } from "@/test/render"

import { EnemyList } from "./enemy-list"

describe("EnemyList", () => {
  // The Quest detail puts the list in a ~250px column beside the board at a 1280px viewport;
  // viewport breakpoints gave it three ~80px columns there and truncated every name.
  it("sizes its columns by its own width, not the viewport's", () => {
    render(<EnemyList isMobile={false} tiles={[]} />)

    const container = screen.getByTestId("battle-enemy-list")
    const grid = container.querySelector("ul")
    expect(container).toHaveClass("@container")
    expect(grid?.className).not.toMatch(/(^|\s)(sm|md|lg|xl|2xl):grid-cols/)
    expect(grid).toHaveClass("@md:grid-cols-2", "@2xl:grid-cols-3")
  })
})

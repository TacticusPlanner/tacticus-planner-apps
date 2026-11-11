import { beforeEach, describe, expect, it, vi } from "vitest"

import { render, screen } from "@/test/render"

import { CollectionSelectBar } from "./collection-select-bar"

const mobile = vi.hoisted(() => ({ value: false }))
vi.mock("@workspace/ui/hooks/use-mobile", () => ({
  useIsMobile: () => mobile.value,
}))

const renderBar = () =>
  render(
    <CollectionSelectBar
      count={2}
      onClear={vi.fn()}
      onCreate={vi.fn()}
      onDone={vi.fn()}
      onSelectAll={vi.fn()}
    />
  )

describe("CollectionSelectBar", () => {
  beforeEach(() => {
    mobile.value = false
  })

  it("sits above the mobile bottom nav and clear of the scroll-to-top button", () => {
    mobile.value = true
    renderBar()
    const bar = screen.getByTestId("collection-select-bar")
    expect(bar).toHaveAttribute("data-mobile", "true")
    expect(bar.className).toContain("bottom-[calc(var(--mobile-nav-height)")
    expect(bar.className).toContain("mr-14")
  })

  it("pins near the viewport bottom on desktop", () => {
    renderBar()
    const bar = screen.getByTestId("collection-select-bar")
    expect(bar).not.toHaveAttribute("data-mobile")
    expect(bar.className).toContain("bottom-3")
  })
})

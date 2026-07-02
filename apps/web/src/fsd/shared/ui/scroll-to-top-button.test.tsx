import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

import { ScrollToTopButton } from "./scroll-to-top-button"

// jsdom never actually lays out content, so scrollHeight/innerHeight/scrollY all default to 0 —
// each test sets up whatever "page" geometry it needs via these three knobs.
function setPageGeometry({
  viewportHeight,
  scrollHeight,
  scrollY,
}: {
  viewportHeight: number
  scrollHeight: number
  scrollY: number
}) {
  Object.defineProperty(window, "innerHeight", {
    configurable: true,
    value: viewportHeight,
  })
  Object.defineProperty(document.documentElement, "scrollHeight", {
    configurable: true,
    value: scrollHeight,
  })
  Object.defineProperty(window, "scrollY", {
    configurable: true,
    value: scrollY,
  })
}

describe("ScrollToTopButton", () => {
  it("stays hidden on a short page even when scrolled to the bottom", async () => {
    setPageGeometry({ viewportHeight: 800, scrollHeight: 1000, scrollY: 200 })
    render(<ScrollToTopButton />)

    fireEvent.scroll(window)

    await waitFor(() => {
      expect(
        screen.queryByTestId("scroll-to-top-button")
      ).not.toBeInTheDocument()
    })
  })

  it("stays hidden on a very long page before the user has scrolled far", async () => {
    // scrollable = 2400 - 800 = 1600, well over the 1.5x-viewport "very long" bar, but scrollY is
    // only ~6% of that — under the 20% threshold.
    setPageGeometry({ viewportHeight: 800, scrollHeight: 2400, scrollY: 100 })
    render(<ScrollToTopButton />)

    fireEvent.scroll(window)

    await waitFor(() => {
      expect(
        screen.queryByTestId("scroll-to-top-button")
      ).not.toBeInTheDocument()
    })
  })

  it("appears on a very long page once scrolled past ~20%", async () => {
    // scrollable = 1600; scrollY 500 is ~31% of that.
    setPageGeometry({ viewportHeight: 800, scrollHeight: 2400, scrollY: 500 })
    render(<ScrollToTopButton />)

    fireEvent.scroll(window)

    await waitFor(() => {
      expect(screen.getByTestId("scroll-to-top-button")).toBeInTheDocument()
    })
  })

  it("scrolls to the top when clicked", async () => {
    setPageGeometry({ viewportHeight: 800, scrollHeight: 2400, scrollY: 500 })
    const scrollTo = vi.fn()
    window.scrollTo = scrollTo
    render(<ScrollToTopButton />)

    fireEvent.scroll(window)
    const button = await waitFor(() =>
      screen.getByTestId("scroll-to-top-button")
    )
    fireEvent.click(button)

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" })
  })
})

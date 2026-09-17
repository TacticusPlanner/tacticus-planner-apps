import { fireEvent } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { render, screen } from "@/test/render"

import { PageTourButton } from "./page-tour-button"

const { tourRef } = vi.hoisted(() => ({
  tourRef: {
    current: {
      hasPageTour: true,
      isRunning: false,
      startPageTour: vi.fn(),
    },
  },
}))

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
vi.mock("./tour-provider", () => ({
  useTour: () => tourRef.current,
}))

describe("PageTourButton", () => {
  it("starts the page tour when activated", () => {
    const startPageTour = vi.fn()
    tourRef.current = { hasPageTour: true, isRunning: false, startPageTour }

    render(<PageTourButton />)

    fireEvent.click(screen.getByTestId("page-tour-button"))

    expect(startPageTour).toHaveBeenCalledTimes(1)
  })

  it("renders nothing on a page with no tour of its own", () => {
    tourRef.current = {
      hasPageTour: false,
      isRunning: false,
      startPageTour: vi.fn(),
    }

    render(<PageTourButton />)

    expect(screen.queryByTestId("page-tour-button")).not.toBeInTheDocument()
  })
})

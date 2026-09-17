import { describe, expect, it, vi } from "vitest"

import { render, screen } from "@/test/render"

import { TourButton } from "./tour-button"

const { startTourMock } = vi.hoisted(() => ({ startTourMock: vi.fn() }))

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
vi.mock("./tour-provider", () => ({
  useTour: () => ({ isRunning: false, startTour: startTourMock }),
}))

describe("TourButton", () => {
  it("starts the tour when activated", () => {
    render(<TourButton />)

    screen.getByTestId("tour-button").click()

    expect(startTourMock).toHaveBeenCalledTimes(1)
  })

  it("calls onStarted after starting the tour", () => {
    const onStarted = vi.fn()
    render(<TourButton onStarted={onStarted} />)

    screen.getByTestId("tour-button").click()

    expect(onStarted).toHaveBeenCalledTimes(1)
  })
})

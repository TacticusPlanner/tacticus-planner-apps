import { fireEvent, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { render, screen } from "@/test/render"

import { TourProvider, useTour } from "./tour-provider"

const { reportError } = vi.hoisted(() => ({ reportError: vi.fn() }))

vi.mock("@/shared/lib", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/lib")>()),
  reportError,
}))
// The tour runtime's chunk failing to download (a non-stale failure, so it is reported).
vi.mock("./tour-runner", () => {
  throw new Error("tour runner exploded")
})

function StartTourProbe() {
  const { startTour } = useTour()
  return <button data-testid="start" onClick={startTour} type="button" />
}

describe("TourProvider when the tour runtime fails to load", () => {
  it("reports the failure and keeps rendering the app", async () => {
    render(
      <TourProvider>
        <StartTourProbe />
        <span data-testid="app">app</span>
      </TourProvider>
    )

    fireEvent.click(screen.getByTestId("start"))

    await waitFor(() =>
      expect(reportError).toHaveBeenCalledWith(
        expect.any(Error),
        "tour runner load"
      )
    )
    expect(screen.getByTestId("app")).toBeInTheDocument()
  })
})

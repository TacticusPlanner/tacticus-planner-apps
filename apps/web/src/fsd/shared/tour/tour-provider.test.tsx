import type { Step } from "react-joyride"
import { fireEvent } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { render, screen } from "@/test/render"

import { TourProvider, useTour, useTourPageSteps } from "./tour-provider"

const { joyrideStepsRef } = vi.hoisted(() => ({
  joyrideStepsRef: { current: [] as Step[] },
}))

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
vi.mock("react-joyride", () => ({
  STATUS: { FINISHED: "finished", SKIPPED: "skipped" },
  useJoyride: ({ steps }: { steps: Step[] }) => {
    joyrideStepsRef.current = steps
    return { Tour: null }
  },
}))
vi.mock("@workspace/ui/hooks/use-mobile", () => ({ useIsMobile: () => false }))
vi.mock("../theme/theme-provider", () => ({
  useTheme: () => ({ theme: "light" }),
}))
vi.mock("./general.tutorial", () => ({
  useDesktopTutorialSteps: () => [{ target: "general-step", content: "" }],
  useMobileTutorialSteps: () => [{ target: "general-step", content: "" }],
}))

function IsRunningProbe() {
  const { isRunning } = useTour()
  return <span data-testid="is-running">{String(isRunning)}</span>
}

const PAGE_STEPS = { desktop: [{ target: "page-step", content: "" }] }

/** Registers page steps, then exposes both tour triggers plus whether a page tour exists. */
function PageTourProbe() {
  const { hasPageTour, startPageTour, startTour } = useTour()
  useTourPageSteps(PAGE_STEPS)

  return (
    <>
      <span data-testid="has-page-tour">{String(hasPageTour)}</span>
      <button data-testid="start-general" onClick={startTour} type="button" />
      <button data-testid="start-page" onClick={startPageTour} type="button" />
    </>
  )
}

const AUTO_STARTED_STORAGE_KEY = "tp.tour.autoStarted"

function targets() {
  return joyrideStepsRef.current.map((step) => step.target)
}

describe("TourProvider", () => {
  it("auto-starts the tour the first time this device opens the app", () => {
    window.localStorage.removeItem(AUTO_STARTED_STORAGE_KEY)

    render(
      <TourProvider>
        <IsRunningProbe />
      </TourProvider>
    )

    expect(screen.getByTestId("is-running")).toHaveTextContent("true")
    expect(window.localStorage.getItem(AUTO_STARTED_STORAGE_KEY)).toBe("1")
  })

  it("does not auto-start again on a device that has already seen it", () => {
    window.localStorage.setItem(AUTO_STARTED_STORAGE_KEY, "1")

    render(
      <TourProvider>
        <IsRunningProbe />
      </TourProvider>
    )

    expect(screen.getByTestId("is-running")).toHaveTextContent("false")
  })

  it("reports that a page tour is available once a page registers steps", () => {
    window.localStorage.setItem(AUTO_STARTED_STORAGE_KEY, "1")

    render(
      <TourProvider>
        <PageTourProbe />
      </TourProvider>
    )

    expect(screen.getByTestId("has-page-tour")).toHaveTextContent("true")
  })

  it("startTour runs the general tour even while a page has its own registered", () => {
    window.localStorage.setItem(AUTO_STARTED_STORAGE_KEY, "1")

    render(
      <TourProvider>
        <PageTourProbe />
      </TourProvider>
    )

    fireEvent.click(screen.getByTestId("start-general"))

    expect(targets()).toEqual(["general-step"])
  })

  it("startPageTour runs the page's own steps", () => {
    window.localStorage.setItem(AUTO_STARTED_STORAGE_KEY, "1")

    render(
      <TourProvider>
        <PageTourProbe />
      </TourProvider>
    )

    fireEvent.click(screen.getByTestId("start-page"))

    expect(targets()).toEqual(["page-step"])
  })

  it("defaults to the general tour before either trigger is used", () => {
    window.localStorage.setItem(AUTO_STARTED_STORAGE_KEY, "1")

    render(
      <TourProvider>
        <PageTourProbe />
      </TourProvider>
    )

    expect(targets()).toEqual(["general-step"])
  })
})

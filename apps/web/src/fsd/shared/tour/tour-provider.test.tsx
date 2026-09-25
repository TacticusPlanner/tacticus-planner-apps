import type { Step } from "react-joyride"
import { fireEvent } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { render, screen } from "@/test/render"

import {
  TourProvider,
  useAutoStartTourOnce,
  useTour,
  useTourPageSteps,
} from "./tour-provider"

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

/** Stands in for the authenticated home page, the one place that opts into the auto-start. */
function AutoStartProbe() {
  useAutoStartTourOnce()
  return <IsRunningProbe />
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

const SHEET_STEPS = { desktop: [{ target: "sheet-step", content: "" }] }

/** A sheet opened over the page: registers its own steps only while mounted. */
function SheetTourProbe() {
  useTourPageSteps(SHEET_STEPS)
  return null
}

function PageWithSheet({ sheetOpen }: { sheetOpen: boolean }) {
  const { startPageTour } = useTour()
  return (
    <>
      <PageTourProbe />
      {sheetOpen ? <SheetTourProbe /> : null}
      <button
        data-testid="start-page-2"
        onClick={startPageTour}
        type="button"
      />
    </>
  )
}

const AUTO_STARTED_STORAGE_KEY = "tp.tour.autoStarted"

function targets() {
  return joyrideStepsRef.current.map((step) => step.target)
}

describe("TourProvider page-step registrations", () => {
  it("shows a sheet's steps while it is open and restores the page's when it closes", () => {
    const { rerender } = render(
      <TourProvider>
        <PageWithSheet sheetOpen={false} />
      </TourProvider>
    )
    fireEvent.click(screen.getByTestId("start-page-2"))
    expect(targets()).toEqual(["page-step"])

    rerender(
      <TourProvider>
        <PageWithSheet sheetOpen />
      </TourProvider>
    )
    expect(targets()).toEqual(["sheet-step"])
    expect(screen.getByTestId("has-page-tour")).toHaveTextContent("true")

    rerender(
      <TourProvider>
        <PageWithSheet sheetOpen={false} />
      </TourProvider>
    )
    expect(targets()).toEqual(["page-step"])
    expect(screen.getByTestId("has-page-tour")).toHaveTextContent("true")
  })
})

describe("TourProvider", () => {
  it("auto-starts the tour the first time a page opts in on this device", () => {
    window.localStorage.removeItem(AUTO_STARTED_STORAGE_KEY)

    render(
      <TourProvider>
        <AutoStartProbe />
      </TourProvider>
    )

    expect(screen.getByTestId("is-running")).toHaveTextContent("true")
    expect(window.localStorage.getItem(AUTO_STARTED_STORAGE_KEY)).toBe("1")
  })

  it("does not auto-start again on a device that has already seen it", () => {
    window.localStorage.setItem(AUTO_STARTED_STORAGE_KEY, "1")

    render(
      <TourProvider>
        <AutoStartProbe />
      </TourProvider>
    )

    expect(screen.getByTestId("is-running")).toHaveTextContent("false")
  })

  it("does not auto-start on its own, without a page opting in", () => {
    // TourProvider wraps the whole app, above the router - so it also mounts on the landing page
    // and for signed-out visitors. Auto-start must come from the authenticated home page instead.
    window.localStorage.removeItem(AUTO_STARTED_STORAGE_KEY)

    render(
      <TourProvider>
        <IsRunningProbe />
      </TourProvider>
    )

    expect(screen.getByTestId("is-running")).toHaveTextContent("false")
    expect(window.localStorage.getItem(AUTO_STARTED_STORAGE_KEY)).toBeNull()
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

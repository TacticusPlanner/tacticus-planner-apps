import { MemoryRouter, Outlet, Route, Routes } from "react-router"
import { renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

import { render } from "@/test/render"
import { setViewportWidth } from "@/test/viewport"
import { homeScreenEventReadyAt } from "@/test/fixtures/home-screen-event"

import type { DailiesOutletContext } from "./dailies-layout"
import { HsePage } from "./hse-page"
import { useHseTutorial } from "./hse-page.tutorial"

type Steps = {
  desktop: { target: string; title: string; content: string }[]
  mobile?: { target: string; title: string; content: string }[]
}

const { register, mocks } = vi.hoisted(() => ({
  register: vi.fn(),
  mocks: { event: undefined as unknown },
}))

vi.mock("react-i18next", () => ({
  initReactI18next: { type: "3rdParty", init: vi.fn() },
  useTranslation: () => ({
    i18n: { language: "en" },
    t: (key: string) => `localized:${key}`,
  }),
}))
vi.mock("@/shared/tour", () => ({
  useTourPageSteps: (steps: unknown) => register(steps),
}))
vi.mock("@/features/daily-raids", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/daily-raids")>()),
  useActiveHomeScreenEvent: () => mocks.event,
  EventFarmSection: () => <section data-testid="hse-raids" />,
  EventTopLocations: () => <section data-testid="hse-top-overall" />,
}))
vi.mock(
  "@/features/home-screen-event-points/model/use-hse-projection",
  async () => {
    const { useFixtureHseProjection } =
      await import("@/test/fixtures/hse-event-points")
    return { useHseProjection: useFixtureHseProjection }
  }
)
vi.mock("@/entities/planning-setting", () => ({
  PlanningSettingsTrigger: () => <button type="button" />,
  PlanningSettingsDialog: () => null,
}))

const lastSteps = () => register.mock.lastCall?.[0] as Steps
/** The steps the tour provider runs at the current viewport (mobile falls back to desktop). */
const stepsForViewport = () => {
  const { result } = renderHook(() => useIsMobile())
  const steps = lastSteps()
  return (result.current ? steps.mobile : undefined) ?? steps.desktop
}

const HOUR = 3_600_000
const readyWith = (definitionId: string, startMs: number, endMs: number) =>
  homeScreenEventReadyAt([
    {
      occurrenceId: "occ-1",
      definitionId,
      startUtc: new Date(startMs).toISOString(),
      endUtc: new Date(endMs).toISOString(),
    },
  ])

function renderPage() {
  const context: DailiesOutletContext = {
    projects: [],
    projectId: undefined,
    setProjectId: vi.fn(),
    projectsUnavailable: false,
    projectsError: false,
    retryProjects: vi.fn(),
  }
  return render(
    <MemoryRouter>
      <Routes>
        <Route path="/" element={<Outlet context={context} />}>
          <Route index element={<HsePage />} />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}

beforeEach(() => register.mockClear())
afterEach(() => vi.unstubAllGlobals())

describe("useHseTutorial", () => {
  const all = {
    hasSwitcher: true,
    hasDetails: true,
    hasMilestones: true,
    hasProjection: true,
    hasLists: true,
  }
  const none = {
    hasSwitcher: false,
    hasDetails: false,
    hasMilestones: false,
    hasProjection: false,
    hasLists: false,
  }

  it("registers localized switcher, status, details, milestones, projection, farm list and top-10 steps on desktop and mobile", () => {
    renderHook(() => useHseTutorial(all))
    const steps = lastSteps()

    expect(steps.mobile).toEqual(steps.desktop)
    expect(steps.desktop.map((step) => step.target)).toEqual([
      '[data-testid="hse-event-switcher"]',
      '[data-testid="hse-status"]',
      '[data-testid="hse-event-details"]',
      '[data-testid="hse-milestones"]',
      '[data-testid="hse-projection"]',
      '[data-testid="hse-raids"]',
      '[data-testid="hse-top-lists"]',
    ])
    for (const step of steps.desktop) {
      expect(step.title).toContain("localized:tour.hse.steps")
      expect(step.content).toContain("localized:tour.hse.steps")
    }
  })

  it("drops the steps whose sections are not shown", () => {
    renderHook(() => useHseTutorial({ ...all, hasLists: false }))
    expect(lastSteps().desktop.map((step) => step.target)).toEqual([
      '[data-testid="hse-event-switcher"]',
      '[data-testid="hse-status"]',
      '[data-testid="hse-event-details"]',
      '[data-testid="hse-milestones"]',
      '[data-testid="hse-projection"]',
    ])

    renderHook(() =>
      useHseTutorial({ ...none, hasSwitcher: true, hasDetails: true })
    )
    expect(lastSteps().desktop.map((step) => step.target)).toEqual([
      '[data-testid="hse-event-switcher"]',
      '[data-testid="hse-status"]',
      '[data-testid="hse-event-details"]',
    ])

    renderHook(() => useHseTutorial(none))
    expect(lastSteps().desktop.map((step) => step.target)).toEqual([
      '[data-testid="hse-status"]',
    ])
  })
})

describe("HSE tour targets", () => {
  it.each([
    ["mobile", 420],
    ["desktop", 1024],
  ])(
    "every %s step (%ipx) targets an element on the page, the switcher first",
    (_viewport, width) => {
      setViewportWidth(width)
      mocks.event = readyWith(
        "hse-machine-hunt",
        Date.now() - HOUR,
        Date.now() + 10 * HOUR
      )
      const { container } = renderPage()

      const steps = stepsForViewport()
      expect(steps[0]?.target).toBe('[data-testid="hse-event-switcher"]')
      // Machine Hunt also scores in Arena and Salvage Run, so it gets a projection.
      expect(steps).toHaveLength(7)
      for (const step of steps) {
        expect(container.querySelector(step.target)).not.toBeNull()
      }
    }
  )

  it.each([
    ["mobile", 420],
    ["desktop", 1024],
  ])(
    "targets the details, milestones and projection of an event without lists (%s, %ipx)",
    (_viewport, width) => {
      setViewportWidth(width)
      mocks.event = readyWith(
        "hse-trait-boost-psyker",
        Date.now() - HOUR,
        Date.now() + 10 * HOUR
      )
      const { container } = renderPage()

      const steps = stepsForViewport()
      expect(steps.map((step) => step.target)).toEqual([
        '[data-testid="hse-event-switcher"]',
        '[data-testid="hse-status"]',
        '[data-testid="hse-event-details"]',
        '[data-testid="hse-milestones"]',
        '[data-testid="hse-projection"]',
      ])
      for (const step of steps) {
        expect(container.querySelector(step.target)).not.toBeNull()
      }
    }
  )

  it.each([
    ["mobile", 420],
    ["desktop", 1024],
  ])(
    "only targets rendered elements for an event without scoring data (%s, %ipx)",
    (_viewport, width) => {
      setViewportWidth(width)
      mocks.event = readyWith(
        "hse-against-the-tide",
        Date.now() - HOUR,
        Date.now() + 10 * HOUR
      )
      const { container } = renderPage()

      const steps = stepsForViewport()
      expect(steps).toHaveLength(3)
      for (const step of steps) {
        expect(container.querySelector(step.target)).not.toBeNull()
      }
    }
  )
})

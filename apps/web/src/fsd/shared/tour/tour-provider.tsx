/* eslint-disable react-refresh/only-export-components */
import type { ReactNode } from "react"
import * as React from "react"

import type { Step } from "react-joyride"

import { safeStorage } from "@/shared/lib"

/** Steps a page registers for its own tour, split by platform since the same target selectors
 *  don't always exist (or make sense) on both - `mobile` falls back to `desktop` when omitted. */
export type TourPageSteps = {
  desktop: Step[]
  mobile?: Step[]
}

/** Which tour is running//requested: the app-wide navigation tutorial, or the current page's own. */
export type TourKind = "general" | "page"

// The react-joyride runtime, loaded only once a tour is first requested.
const TourRunner = React.lazy(() =>
  import("./tour-runner").then((m) => ({ default: m.TourRunner }))
)

type TourContextValue = {
  isRunning: boolean
  /** Starts the app-wide navigation tour. Always the general one, regardless of which page is
   *  open - a page's own tour is started separately via `startPageTour`. */
  startTour: () => void
  /** Starts the current page's own tour. No-op when the page hasn't registered one (check
   *  `hasPageTour` before offering this to the user). */
  startPageTour: () => void
  /** Starts the navigation tour the first time it's called on this device, then never again.
   *  Call it only from somewhere that is both signed-in and the main page - see
   *  `useAutoStartTourOnce`. */
  maybeAutoStartTour: () => void
  /** Whether the current page registered its own tour steps, i.e. whether `startPageTour` does
   *  anything - drives whether a page-level "Tour this page" control renders at all. */
  hasPageTour: boolean
  stopTour: () => void
  /** Registers a page's (or an open sheet's) own tour steps and returns the function that removes them.
   *  Registrations stack: the most recent one is the active page tour, and removing it restores the
   *  previous one — so a sheet opened over a page overrides the page's steps only while it is open. */
  /** Registers or updates (in place, keeping its stack position) the steps held under `key`; an
   *  `overlay` registration (a dialog or sheet) outranks every page registration. */
  registerPageSteps: (
    steps: TourPageSteps,
    key?: object,
    overlay?: boolean
  ) => () => void
  unregisterPageSteps: (key: object) => void
  // Lets a mobile tutorial step force the theme/language/tour-replay Popover (AuthControl /
  // MobileGuestSettings) open - see useTourControlledPopoverOpen - since a DOM-click simulation
  // races with react-joyride's overlay and Radix's own outside-click dismissal.
  mobileMenuForceOpen: boolean
  setMobileMenuForceOpen: (open: boolean) => void
}

const TourContext = React.createContext<TourContextValue | undefined>(undefined)

// Set the first time the navigation tour auto-starts on this device, so it never repeats.
const AUTO_STARTED_STORAGE_KEY = "tp.tour.autoStarted"

export function TourProvider({ children }: { children: ReactNode }) {
  const [run, setRun] = React.useState(false)
  // Whether any tour has been requested yet: the runner (and react-joyride) is loaded from then on.
  const [requested, setRequested] = React.useState(false)
  // Each registration keeps its slot while its steps change, so a page whose steps update while a
  // dialog's are on top (e.g. once its data loads) doesn't jump back above the dialog's tour.
  // An overlay (dialog/sheet) mounted together with its page registers first (child effects run
  // before the parent's), so overlays rank above pages regardless of registration order.
  const [pageStepStack, setPageStepStack] = React.useState<
    { key: object; steps: TourPageSteps; overlay: boolean }[]
  >([])
  const pageSteps =
    (pageStepStack.findLast((entry) => entry.overlay) ?? pageStepStack.at(-1))
      ?.steps ?? null
  const unregisterPageSteps = React.useCallback((key: object) => {
    setPageStepStack((stack) => stack.filter((entry) => entry.key !== key))
  }, [])
  const registerPageSteps = React.useCallback(
    (steps: TourPageSteps, key: object = steps, overlay = false) => {
      setPageStepStack((stack) => {
        const index = stack.findIndex((entry) => entry.key === key)
        if (index === -1) return [...stack, { key, steps, overlay }]
        const next = [...stack]
        next[index] = { key, steps, overlay }
        return next
      })
      return () => unregisterPageSteps(key)
    },
    [unregisterPageSteps]
  )
  const [mobileMenuForceOpen, setMobileMenuForceOpen] = React.useState(false)
  // Which tour the running/next run shows. Defaults to "general": the auto-start above and the
  // persistent "Show me around" control both mean the navigation tour, even on a page that has
  // its own - that one is reached explicitly via startPageTour.
  const [tourKind, setTourKind] = React.useState<TourKind>("general")

  const start = React.useCallback((kind: TourKind) => {
    setTourKind(kind)
    setRequested(true)
    setRun(true)
  }, [])
  const startTour = React.useCallback(() => start("general"), [start])
  const startPageTour = React.useCallback(() => start("page"), [start])
  const maybeAutoStartTour = React.useCallback(() => {
    if (safeStorage.get(AUTO_STARTED_STORAGE_KEY)) return
    safeStorage.set(AUTO_STARTED_STORAGE_KEY, "1")
    start("general")
  }, [start])
  const stopTour = React.useCallback(() => setRun(false), [])
  const onFinish = React.useCallback(() => {
    setRun(false)
    // Safety net: if the tour ends mid-way through the mobile-menu steps (e.g. Skip), don't
    // leave the Popover stuck forced open.
    setMobileMenuForceOpen(false)
  }, [])
  const hasPageTour = pageSteps !== null

  const value = React.useMemo<TourContextValue>(
    () => ({
      isRunning: run,
      startTour,
      startPageTour,
      maybeAutoStartTour,
      hasPageTour,
      stopTour,
      registerPageSteps,
      unregisterPageSteps,
      mobileMenuForceOpen,
      setMobileMenuForceOpen,
    }),
    [
      run,
      startTour,
      startPageTour,
      maybeAutoStartTour,
      hasPageTour,
      stopTour,
      registerPageSteps,
      unregisterPageSteps,
      mobileMenuForceOpen,
    ]
  )

  return (
    <TourContext.Provider value={value}>
      {requested ? (
        <React.Suspense fallback={null}>
          <TourRunner
            onFinish={onFinish}
            pageSteps={pageSteps}
            run={run}
            setMobileMenuForceOpen={setMobileMenuForceOpen}
            tourKind={tourKind}
          />
        </React.Suspense>
      ) : null}
      {children}
    </TourContext.Provider>
  )
}

export const useTour = () => {
  const context = React.useContext(TourContext)

  if (context === undefined) {
    throw new Error("useTour must be used within a TourProvider")
  }

  return context
}

/** Lets a page register its own tour steps while mounted, overriding the general tutorial -
 *  reverts to the previously registered steps (the default tutorial when there are none) on
 *  unmount. Registrations stack, so a sheet that registers its own steps while open hands the page's
 *  back when it closes. Memoize `steps` (it's an effect dependency) so registration doesn't churn
 *  every render. */
export function useTourPageSteps(
  steps: TourPageSteps,
  { overlay = false }: { overlay?: boolean } = {}
) {
  const { registerPageSteps, unregisterPageSteps } = useTour()
  const [key] = React.useState(() => ({}))

  React.useEffect(() => {
    registerPageSteps(steps, key, overlay)
  }, [steps, key, overlay, registerPageSteps])
  React.useEffect(
    () => () => unregisterPageSteps(key),
    [key, unregisterPageSteps]
  )
}

/**
 * Runs the navigation tour once, the first time this device reaches the page that calls this.
 *
 * Deliberately not done in the provider: `TourProvider` wraps the whole app, above the router, so
 * auto-starting there fired on the landing page and for signed-out visitors too. Calling it from
 * the authenticated home page instead gives both constraints for free - that route is behind
 * `ProtectedRoute`, so it renders only when signed in, and only for the main page.
 */
export function useAutoStartTourOnce() {
  const { maybeAutoStartTour } = useTour()

  React.useEffect(() => {
    maybeAutoStartTour()
  }, [maybeAutoStartTour])
}

/** Backs a Popover that the mobile tutorial needs to force open/closed (see general.tutorial.tsx).
 *  Open state is the OR of independent user interaction and the tour's force-open flag, so normal
 *  clicks (via the returned setter) and the tour's control never fight each other - once the tour
 *  clears its flag, the popover falls back to whatever the user last set (closed, unless they
 *  opened it themselves in the meantime). */
export function useTourControlledPopoverOpen() {
  const { mobileMenuForceOpen } = useTour()
  const [userOpen, setUserOpen] = React.useState(false)

  return [userOpen || mobileMenuForceOpen, setUserOpen] as const
}

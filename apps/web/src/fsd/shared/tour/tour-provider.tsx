/* eslint-disable react-refresh/only-export-components */
import type { ReactNode } from "react"
import * as React from "react"

import { useTranslation } from "react-i18next"
import {
  STATUS,
  type Locale,
  type Options,
  type Status,
  type Step,
  type Styles,
  useJoyride,
} from "react-joyride"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

import { useTheme } from "../theme/theme-provider"
import {
  useDesktopTutorialSteps,
  useMobileTutorialSteps,
} from "./general.tutorial"

/** Steps a page registers for its own tour, split by platform since the same target selectors
 *  don't always exist (or make sense) on both - `mobile` falls back to `desktop` when omitted. */
export type TourPageSteps = {
  desktop: Step[]
  mobile?: Step[]
}

/** Which tour is running//requested: the app-wide navigation tutorial, or the current page's own. */
type TourKind = "general" | "page"

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
  registerPageSteps: (steps: TourPageSteps) => () => void
  // Lets a mobile tutorial step force the theme/language/tour-replay Popover (AuthControl /
  // MobileGuestSettings) open - see useTourControlledPopoverOpen - since a DOM-click simulation
  // races with react-joyride's overlay and Radix's own outside-click dismissal.
  mobileMenuForceOpen: boolean
  setMobileMenuForceOpen: (open: boolean) => void
}

const TourContext = React.createContext<TourContextValue | undefined>(undefined)

// Set the first time the navigation tour auto-starts on this device, so it never repeats.
const AUTO_STARTED_STORAGE_KEY = "tp.tour.autoStarted"

// Statuses that mean the tour is over and the trigger should re-enable.
const completedStatuses: Status[] = [STATUS.FINISHED, STATUS.SKIPPED]

// Tour surfaces per theme. In dark mode the page is dimmed hard for focus, but
// --popover is darker than --background, so the tooltip is lifted above it and
// given a brighter border — otherwise the card blends into the dark backdrop.
const tourSurface = {
  dark: {
    arrowColor: "oklch(0.28 0.018 266.853)",
    backgroundColor: "oklch(0.28 0.018 266.853)",
    borderColor: "oklch(0.46 0.03 265.89)",
    overlayColor: "rgba(0, 0, 0, 0.8)",
  },
  light: {
    arrowColor: "var(--popover)",
    backgroundColor: "var(--popover)",
    borderColor: "var(--border)",
    overlayColor: "rgba(0, 0, 0, 0.5)",
  },
} as const

function prefersDark() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  )
}

// Theme-independent colors reference the design-system CSS variables so the
// tour follows the active theme (the tooltip portals onto <body>, where the
// variables still cascade). Surface/overlay colors are applied per-theme below.
const tourOptions: Partial<Options> = {
  buttons: ["back", "skip", "primary"],
  primaryColor: "var(--primary)",
  showProgress: true,
  skipBeacon: true,
  spotlightPadding: 8,
  spotlightRadius: 8,
  textColor: "var(--popover-foreground)",
  zIndex: 1000,
}

const tourStyles: Partial<Styles> = {
  buttonBack: { color: "var(--muted-foreground)" },
  buttonClose: { color: "var(--muted-foreground)" },
  buttonPrimary: {
    backgroundColor: "var(--primary)",
    borderRadius: "var(--radius-md)",
    color: "var(--primary-foreground)",
  },
  buttonSkip: { color: "var(--muted-foreground)" },
  tooltip: {
    borderRadius: "var(--radius)",
    boxShadow: "0 24px 48px -12px rgba(0, 0, 0, 0.65)",
    fontSize: 14,
  },
  tooltipContent: { padding: "12px 0" },
  tooltipTitle: { fontSize: 16, fontWeight: 600 },
}

export function TourProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const isMobile = useIsMobile()
  const [run, setRun] = React.useState(false)
  const [pageStepStack, setPageStepStack] = React.useState<TourPageSteps[]>([])
  const pageSteps =
    pageStepStack.length > 0 ? pageStepStack[pageStepStack.length - 1] : null
  const registerPageSteps = React.useCallback((steps: TourPageSteps) => {
    setPageStepStack((stack) => [...stack, steps])
    return () =>
      setPageStepStack((stack) => {
        const index = stack.lastIndexOf(steps)
        return index === -1 ? stack : stack.filter((_, i) => i !== index)
      })
  }, [])
  const [mobileMenuForceOpen, setMobileMenuForceOpen] = React.useState(false)
  // Which tour the running/next run shows. Defaults to "general": the auto-start above and the
  // persistent "Show me around" control both mean the navigation tour, even on a page that has
  // its own - that one is reached explicitly via startPageTour.
  const [tourKind, setTourKind] = React.useState<TourKind>("general")

  const isDark = theme === "dark" || (theme === "system" && prefersDark())
  const surface = isDark ? tourSurface.dark : tourSurface.light

  const options = React.useMemo<Partial<Options>>(
    () => ({
      ...tourOptions,
      arrowColor: surface.arrowColor,
      backgroundColor: surface.backgroundColor,
      overlayColor: surface.overlayColor,
    }),
    [surface]
  )

  const styles = React.useMemo<Partial<Styles>>(
    () => ({
      ...tourStyles,
      tooltip: {
        ...tourStyles.tooltip,
        border: `1px solid ${surface.borderColor}`,
      },
    }),
    [surface]
  )

  // The general layout/navigation tutorial - used for Home and as the fallback for any page (e.g.
  // UI Kit) that doesn't register its own steps via useTourPageSteps.
  const desktopDefaultSteps = useDesktopTutorialSteps()
  const mobileDefaultSteps = useMobileTutorialSteps(setMobileMenuForceOpen)
  const defaultSteps = isMobile ? mobileDefaultSteps : desktopDefaultSteps

  const steps = React.useMemo<Step[]>(() => {
    if (tourKind === "general" || !pageSteps) return defaultSteps
    return (isMobile ? pageSteps.mobile : undefined) ?? pageSteps.desktop
  }, [tourKind, pageSteps, defaultSteps, isMobile])

  const locale = React.useMemo<Locale>(
    () => ({
      back: t("tour.controls.back"),
      close: t("tour.controls.close"),
      last: t("tour.controls.last"),
      next: t("tour.controls.next"),
      nextWithProgress: t("tour.controls.nextWithProgress"),
      skip: t("tour.controls.skip"),
    }),
    [t]
  )

  const { Tour } = useJoyride({
    continuous: true,
    locale,
    options,
    run,
    steps,
    styles,
    onEvent: (data) => {
      if (completedStatuses.includes(data.status)) {
        setRun(false)
        // Safety net: if the tour ends mid-way through the mobile-menu steps (e.g. Skip), don't
        // leave the Popover stuck forced open.
        setMobileMenuForceOpen(false)
      }
    },
  })

  const startTour = React.useCallback(() => {
    setTourKind("general")
    setRun(true)
  }, [])
  const startPageTour = React.useCallback(() => {
    setTourKind("page")
    setRun(true)
  }, [])
  const maybeAutoStartTour = React.useCallback(() => {
    if (window.localStorage.getItem(AUTO_STARTED_STORAGE_KEY)) return
    window.localStorage.setItem(AUTO_STARTED_STORAGE_KEY, "1")
    setTourKind("general")
    setRun(true)
  }, [])
  const stopTour = React.useCallback(() => setRun(false), [])
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
      mobileMenuForceOpen,
    ]
  )

  return (
    <TourContext.Provider value={value}>
      {Tour}
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
export function useTourPageSteps(steps: TourPageSteps) {
  const { registerPageSteps } = useTour()

  React.useEffect(() => registerPageSteps(steps), [steps, registerPageSteps])
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

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

type TourContextValue = {
  isRunning: boolean
  startTour: () => void
  stopTour: () => void
  setPageSteps: (steps: TourPageSteps | null) => void
}

const TourContext = React.createContext<TourContextValue | undefined>(undefined)

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
  const [pageSteps, setPageSteps] = React.useState<TourPageSteps | null>(null)

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
  const mobileDefaultSteps = useMobileTutorialSteps()
  const defaultSteps = isMobile ? mobileDefaultSteps : desktopDefaultSteps

  const steps = React.useMemo<Step[]>(() => {
    if (!pageSteps) return defaultSteps
    return (isMobile ? pageSteps.mobile : undefined) ?? pageSteps.desktop
  }, [pageSteps, defaultSteps, isMobile])

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
      }
    },
  })

  const startTour = React.useCallback(() => setRun(true), [])
  const stopTour = React.useCallback(() => setRun(false), [])

  const value = React.useMemo<TourContextValue>(
    () => ({ isRunning: run, startTour, stopTour, setPageSteps }),
    [run, startTour, stopTour]
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
 *  reverts to the default steps automatically on unmount. Memoize `steps` (it's an effect
 *  dependency) so registration doesn't churn every render. */
export function useTourPageSteps(steps: TourPageSteps) {
  const { setPageSteps } = useTour()

  React.useEffect(() => {
    setPageSteps(steps)
    return () => setPageSteps(null)
  }, [steps, setPageSteps])
}

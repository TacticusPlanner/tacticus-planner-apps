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
  withoutMissingOptionalSteps,
  useMobileTutorialSteps,
} from "./general.tutorial"
import type { TourKind, TourPageSteps } from "./tour-provider"

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

/**
 * The react-joyride runtime. `TourProvider` lazy-loads and mounts this only once a tour has been
 * requested, so the tour library stays out of the startup bundle.
 */
export function TourRunner({
  run,
  tourKind,
  pageSteps,
  onFinish,
  setMobileMenuForceOpen,
}: {
  run: boolean
  tourKind: TourKind
  pageSteps: TourPageSteps | null
  onFinish: () => void
  setMobileMenuForceOpen: (open: boolean) => void
}) {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const isMobile = useIsMobile()

  const isDark = theme === "dark" || (theme === "system" && prefersDark())
  const surface = isDark ? tourSurface.dark : tourSurface.light

  const options = React.useMemo<Partial<Options>>(
    () => ({
      ...tourOptions,
      // Joyride scrolls a target to 20px below the viewport top by default, which leaves it under
      // the sticky shell header: 48px on desktop, ~125px on mobile (title plus section tabs). Clear
      // the header plus the spotlight padding instead.
      scrollOffset: isMobile ? 140 : 64,
      arrowColor: surface.arrowColor,
      backgroundColor: surface.backgroundColor,
      overlayColor: surface.overlayColor,
    }),
    [surface, isMobile]
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
  // Re-evaluated when a run starts, so optional steps reflect the page the tour starts on.
  const desktopSteps = React.useMemo(
    () =>
      run
        ? withoutMissingOptionalSteps(desktopDefaultSteps)
        : desktopDefaultSteps,
    [run, desktopDefaultSteps]
  )
  const defaultSteps = isMobile ? mobileDefaultSteps : desktopSteps

  const steps = React.useMemo<Step[]>(() => {
    if (tourKind === "general" || !pageSteps) return defaultSteps
    const page = (isMobile ? pageSteps.mobile : undefined) ?? pageSteps.desktop
    return run ? withoutMissingOptionalSteps(page) : page
  }, [tourKind, pageSteps, defaultSteps, isMobile, run])

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
      if (completedStatuses.includes(data.status)) onFinish()
    },
  })

  return Tour
}

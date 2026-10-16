import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Step } from "react-joyride"

import type { TourPageSteps } from "@/shared/tour"

const MASTER_TABLE_TOUR_TARGETS = {
  controls: '[data-testid="master-table-controls"]',
  events: '[data-testid="master-table-events"]',
  pointsMode: '[data-testid="master-table-points-mode"]',
  firstRow: '[data-testid="master-table-first-row"]',
} as const

/** Resolves once `selector` is (or is no longer, with `present` false) in the document, or after
 *  `timeoutMs`. */
function waitForElement(
  selector: string,
  timeoutMs: number,
  present = true
): Promise<void> {
  return new Promise((resolve) => {
    const deadline = Date.now() + timeoutMs
    const check = () => {
      if (
        (document.querySelector(selector) !== null) === present ||
        Date.now() >= deadline
      ) {
        resolve()
        return
      }
      setTimeout(check, 16)
    }
    check()
  })
}

/**
 * The master table tour (design D5): the controls (on mobile the Controls button), the event
 * picker, the points mode and the first row. The targets are the same on both forms; on mobile the
 * tour opens the controls sheet before the picker step and closes it before the first-row step.
 */
export function useMasterTableTutorial(
  setControlsOpen: (open: boolean) => void
): TourPageSteps {
  const { t } = useTranslation("legendaryEvents")
  return useMemo(() => {
    const step = (
      key: keyof typeof MASTER_TABLE_TOUR_TARGETS,
      placement: Step["placement"]
    ): Step => ({
      target: MASTER_TABLE_TOUR_TARGETS[key],
      placement,
      title: t(`tour.masterTable.steps.${key}.title`),
      content: t(`tour.masterTable.steps.${key}.content`),
    })
    const desktop: Step[] = [
      step("controls", "bottom"),
      step("events", "bottom"),
      step("pointsMode", "bottom"),
      step("firstRow", "top"),
    ]
    const mobile: Step[] = [
      {
        ...step("controls", "bottom"),
        before: async () => setControlsOpen(false),
      },
      {
        ...step("events", "top"),
        before: async () => {
          setControlsOpen(true)
          await waitForElement(
            '[data-testid="master-table-controls-sheet"]',
            1000
          )
        },
      },
      step("pointsMode", "top"),
      {
        ...step("firstRow", "bottom"),
        before: async () => {
          setControlsOpen(false)
          await waitForElement(
            '[data-testid="master-table-controls-sheet"]',
            1000,
            false
          )
        },
      },
    ]
    return { desktop, mobile }
  }, [setControlsOpen, t])
}

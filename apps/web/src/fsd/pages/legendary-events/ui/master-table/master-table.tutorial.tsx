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
const SHEET_SELECTOR = '[data-testid="master-table-controls-sheet"]'

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
 * picker and points-mode steps open the controls sheet (so Back from the first row reopens it) and
 * the controls and first-row steps close it. The sheet is modal (body pointer events off, focus
 * trapped), so its steps keep the tooltip clickable and skip Joyride's focus trap, as the general
 * tour's account-drawer step does.
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
    const openSheet = async () => {
      setControlsOpen(true)
      await waitForElement(SHEET_SELECTOR, 1000)
    }
    const closeSheet = async () => {
      setControlsOpen(false)
      await waitForElement(SHEET_SELECTOR, 1000, false)
    }
    const inSheet = (step: Step): Step => ({
      ...step,
      before: openSheet,
      // The modal sheet disables body pointer events; the portaled tooltip must stay tappable.
      styles: { tooltip: { pointerEvents: "auto" } },
      disableFocusTrap: true,
    })
    const mobile: Step[] = [
      { ...step("controls", "bottom"), before: closeSheet },
      inSheet(step("events", "top")),
      inSheet(step("pointsMode", "top")),
      { ...step("firstRow", "bottom"), before: closeSheet },
    ]
    return { desktop, mobile }
  }, [setControlsOpen, t])
}

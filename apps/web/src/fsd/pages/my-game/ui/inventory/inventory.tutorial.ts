import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Step } from "react-joyride"

import { useTourPageSteps } from "@/shared/tour"

type StepKey = "tabs" | "sync"

/** A step a tab adds after the page's own: its target's test id and its copy under `tour.steps`. */
export type InventoryTabStep = {
  target: string
  key: string
  /** The target can be missing (nothing listed, a closed sheet); the tour skips it then. */
  optional?: boolean
}

/**
 * Joyride tour for the Inventory page: the Upgrades / Ascension tabs and the sync note, then the open
 * tab's own steps. Each tab calls it with its steps (a module constant, so the registration is
 * stable), since the page tour holds one list at a time.
 */
export function useInventoryTutorial(tabSteps: readonly InventoryTabStep[]) {
  const { t } = useTranslation("inventory")

  const steps = useMemo(() => {
    const step = (target: string, key: string, optional = false): Step => ({
      target: `[data-testid="${target}"]`,
      // Tab step keys are typed by their tab; the copy lives beside the page's own.
      title: t(`tour.steps.${key}.title` as `tour.steps.${StepKey}.title`),
      content: t(
        `tour.steps.${key}.content` as `tour.steps.${StepKey}.content`
      ),
      ...(optional ? { data: { optional: true } } : {}),
    })
    const shared: Step[] = [
      step("inventory-tabs", "tabs"),
      step("inventory-sync-note", "sync"),
      ...tabSteps.map((entry) => step(entry.target, entry.key, entry.optional)),
    ]
    return { desktop: shared, mobile: shared }
  }, [t, tabSteps])

  useTourPageSteps(steps)
}

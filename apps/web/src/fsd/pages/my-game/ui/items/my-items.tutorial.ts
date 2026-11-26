import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Step } from "react-joyride"

import { useTourPageSteps } from "@/shared/tour"

import type { ItemsTab } from "./items-outlet"

type StepKey =
  | "tabs"
  | "piecesFind"
  | "piecesView"
  | "piece"
  | "suggestion"
  | "relics"
  | "reclaimSummary"
  | "reclaimStack"

const TAB_STEPS: Record<
  ItemsTab,
  [target: string, key: StepKey, optional?: boolean][]
> = {
  pieces: [
    ["items-pieces-find", "piecesFind"],
    ["items-pieces-view", "piecesView"],
    ["item-piece", "piece", true],
  ],
  suggestions: [
    ["item-suggestion-character", "suggestion", true],
    ["items-unworn-relics", "relics", true],
  ],
  reclaim: [
    ["items-reclaim-summary", "reclaimSummary", true],
    ["item-reclaim-stack", "reclaimStack", true],
  ],
}

/**
 * Joyride tour for My game > Items: the tab strip, then the open tab's own controls and its first
 * entry. Entries that can be missing (no items, nothing to suggest) are optional, so the tour skips
 * them. Desktop and mobile share the targets (the View step is the View button on a phone).
 */
export function useItemsTutorial({
  tab,
  ready,
}: {
  tab: ItemsTab
  ready: boolean
}) {
  const { t } = useTranslation("myItems")
  const steps = useMemo(() => {
    const step = (target: string, key: StepKey, optional = false): Step => ({
      target: `[data-testid="${target}"]`,
      title: t(`tour.${key}.title`),
      content: t(`tour.${key}.content`),
      ...(optional ? { data: { optional: true } } : {}),
    })
    const list: Step[] = [
      step("items-tab-pieces", "tabs"),
      ...(ready
        ? TAB_STEPS[tab].map(([target, key, optional]) =>
            step(target, key, optional)
          )
        : []),
    ]
    return { desktop: list, mobile: list }
  }, [t, tab, ready])
  useTourPageSteps(steps)
}

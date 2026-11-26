/** The Survival page's tabs, each its own route under /plan/survival. */
export const SURVIVAL_TABS = [
  "team",
  "enemies",
  "rewards",
  "missions",
  "offers",
] as const

export type SurvivalTab = (typeof SURVIVAL_TABS)[number]

export function isSurvivalTab(value: unknown): value is SurvivalTab {
  return (SURVIVAL_TABS as readonly unknown[]).includes(value)
}

/** A tab's path with the event kept in `?event=`. */
export function survivalTabHref(tab: SurvivalTab, eventId: string | null) {
  return eventId === null
    ? `/plan/survival/${tab}`
    : `/plan/survival/${tab}?event=${encodeURIComponent(eventId)}`
}

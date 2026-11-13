import { eventStatus } from "@workspace/game-catalog"

// Route rules of Dailies › Event shop (spec event-shop-planner: Event shop is a signed-in Dailies page;
// Day selection lives in the Shop tab; Desktop, tablet and phone layouts differ).

interface EventTiming {
  id: string
  startUtc: string
  dayCount: number
}

/** The running event; else the next upcoming one; else the most recently started one. */
export function defaultEventId(
  events: readonly EventTiming[],
  now: number
): string | null {
  const running = events.find((event) => eventStatus(event, now) === "running")
  if (running) return running.id
  const byStart = [...events].sort(
    (a, b) => Date.parse(a.startUtc) - Date.parse(b.startUtc)
  )
  const upcoming = byStart.find(
    (event) => eventStatus(event, now) === "upcoming"
  )
  return upcoming?.id ?? byStart.at(-1)?.id ?? null
}

/** Phone < 768 px, tablet 768–1023 px, desktop ≥ 1024 px. */
export type EventShopForm = "phone" | "tablet" | "desktop"

export type EventShopTab =
  "shop" | "milestones" | "missions" | "plan" | "rewards"

const TABS_BY_FORM: Record<EventShopForm, readonly EventShopTab[]> = {
  desktop: ["shop", "milestones", "missions"],
  tablet: ["shop", "milestones", "missions"],
  phone: ["shop", "plan", "rewards"],
}

export function eventShopTabs(form: EventShopForm): readonly EventShopTab[] {
  return TABS_BY_FORM[form]
}

/** `?tab=` as the form shows it: a tab the form lacks maps to its nearest one, anything else to Shop. */
export function normalizeEventShopTab(
  value: string | null,
  form: EventShopForm
): EventShopTab {
  const tabs = TABS_BY_FORM[form]
  if (tabs.includes(value as EventShopTab)) return value as EventShopTab
  if (form === "phone") {
    return value === "milestones" || value === "missions" ? "rewards" : "shop"
  }
  return value === "rewards" ? "milestones" : "shop"
}

/** `?day=` as an event day index, or null when absent or out of range. */
export function parseEventShopDay(
  value: string | null,
  dayCount: number
): number | null {
  if (value === null || !/^\d+$/.test(value)) return null
  const day = Number(value)
  return day < dayCount ? day : null
}

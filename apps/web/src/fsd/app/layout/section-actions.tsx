import { lazy, Suspense } from "react"

import type { NavItem } from "./nav-items"

// Only the Legendary Events section shows it, so it's lazy-loaded rather than pulled into the
// shell's startup graph (see scripts/bundle-budget.mjs). It renders nothing while signed out.
const LegendaryEventSettingsButton = lazy(() =>
  import("@/features/legendary-event-plan").then((m) => ({
    default: m.LegendaryEventSettingsButton,
  }))
)

/** A section's own header actions beside its tabs (mobile) or title (desktop): the Legendary Events
 *  settings; nothing for any other section. */
export function SectionActions({ item }: { item: NavItem | undefined }) {
  if (item?.path !== "/legendary-events") return null
  return (
    <Suspense fallback={null}>
      <LegendaryEventSettingsButton />
    </Suspense>
  )
}

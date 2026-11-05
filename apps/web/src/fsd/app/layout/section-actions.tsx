import { useIsAuthenticated } from "@azure/msal-react"

import { LegendaryEventSettingsButton } from "@/features/legendary-event-plan"

import type { NavItem } from "./nav-items"

/** A section's own header actions beside its tabs (mobile) or title (desktop): the Legendary Events
 *  settings for a signed-in player; nothing for any other section. */
export function SectionActions({ item }: { item: NavItem | undefined }) {
  const isAuthenticated = useIsAuthenticated()
  if (!isAuthenticated || item?.path !== "/legendary-events") return null
  return <LegendaryEventSettingsButton />
}

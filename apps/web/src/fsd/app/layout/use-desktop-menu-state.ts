import { useCallback } from "react"

import { storedPreference, usePersistedSelection } from "@/shared/lib"

export const PRIMARY_MENU = storedPreference("nav", "primaryMenu")
export const SECTION_MENU = storedPreference("nav", "sectionMenu")

type MenuState = "expanded" | "collapsed"

function isMenuState(value: unknown): value is MenuState {
  return value === "expanded" || value === "collapsed"
}

/**
 * Presentation state of the desktop menus, remembered per device: each menu saves expanded or
 * collapsed in the `tp.nav` record and reads it back on load. Without a saved choice (a
 * new device, a private window, blocked storage) the main rail starts compact and the section menu
 * expanded. The sidebar's own `sidebar_state` cookie is never a restoration source.
 */
export function useDesktopMenuState() {
  const [primary, setPrimary] = usePersistedSelection(
    PRIMARY_MENU,
    isMenuState,
    "collapsed"
  )
  const [section, setSection] = usePersistedSelection(
    SECTION_MENU,
    isMenuState,
    "expanded"
  )
  const setPrimaryExpanded = useCallback(
    (expanded: boolean) => setPrimary(expanded ? "expanded" : "collapsed"),
    [setPrimary]
  )
  const setSectionExpanded = useCallback(
    (expanded: boolean) => setSection(expanded ? "expanded" : "collapsed"),
    [setSection]
  )

  return {
    primaryExpanded: primary === "expanded",
    setPrimaryExpanded,
    sectionExpanded: section === "expanded",
    setSectionExpanded,
  }
}

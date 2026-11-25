import { useCallback } from "react"

import { usePersistedSelection } from "@/shared/lib"

export const PRIMARY_MENU_STORAGE_KEY = "nav.desktop.primaryMenu.v1"
export const SECTION_MENU_STORAGE_KEY = "nav.desktop.sectionMenu.v1"

type MenuState = "expanded" | "collapsed"

function isMenuState(value: unknown): value is MenuState {
  return value === "expanded" || value === "collapsed"
}

/**
 * Presentation state of the desktop menus, remembered per device: each menu saves expanded or
 * collapsed under its own `localStorage` key and reads it back on load. Without a saved choice (a
 * new device, a private window, blocked storage) the main rail starts compact and the section menu
 * expanded. The sidebar's own `sidebar_state` cookie is never a restoration source.
 */
export function useDesktopMenuState() {
  const [primary, setPrimary] = usePersistedSelection(
    PRIMARY_MENU_STORAGE_KEY,
    isMenuState,
    "collapsed"
  )
  const [section, setSection] = usePersistedSelection(
    SECTION_MENU_STORAGE_KEY,
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

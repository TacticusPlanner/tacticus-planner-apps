import { useState } from "react"

/**
 * Presentation state of the desktop menus: the main rail starts compact and the section menu
 * starts expanded on every new document. Held in React state only - never read from or written to
 * cookies/storage (the sidebar's own `sidebar_state` cookie is never a restoration source) - so a
 * refresh resets it while client-side navigation and breakpoint changes keep it.
 */
export function useDesktopMenuState() {
  const [primaryExpanded, setPrimaryExpanded] = useState(false)
  const [sectionExpanded, setSectionExpanded] = useState(true)

  return {
    primaryExpanded,
    setPrimaryExpanded,
    sectionExpanded,
    setSectionExpanded,
  }
}

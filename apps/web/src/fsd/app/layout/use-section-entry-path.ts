import { useState } from "react"

import type { NavItem } from "./nav-items"

const STORAGE_KEY = "nav.lastVisitedChild"

function readStoredEntries(): Record<string, string> {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    return parsed && typeof parsed === "object"
      ? (parsed as Record<string, string>)
      : {}
  } catch {
    return {}
  }
}

function writeStoredEntries(entries: Record<string, string>) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch {
    // sessionStorage unavailable (private mode, disabled by policy) - degrade to in-memory only.
  }
}

function findActiveSection(navItems: NavItem[], pathname: string) {
  return navItems.find(
    (item) => pathname === item.path || pathname.startsWith(item.path + "/")
  )
}

/**
 * Desktop-only "remember last visited child" tracking. Mounted once above both shells so a child
 * page visited via any surface (desktop sidebar, mobile drawer, bottom bar, or search) is recorded,
 * even though only the desktop sidebar resolves an entry path from it.
 */
export function useSectionEntryPath(navItems: NavItem[], pathname: string) {
  const [lastVisitedChild, setLastVisitedChild] = useState<
    Record<string, string>
  >(() => readStoredEntries())
  // Tracks the pathname this state was last updated for, so a route change - including the very
  // first render - can be detected and reacted to during render (React's "adjusting state"
  // pattern) instead of in a separate Effect pass, which would trigger a second, cascading render.
  const [trackedPathname, setTrackedPathname] = useState<string | null>(null)

  if (pathname !== trackedPathname) {
    setTrackedPathname(pathname)

    const section = findActiveSection(navItems, pathname)
    const child = section?.children?.find(
      (candidate) =>
        pathname === candidate.path || pathname.startsWith(candidate.path + "/")
    )

    if (
      section &&
      section.children &&
      section.children.length > 1 &&
      child &&
      lastVisitedChild[section.path] !== child.path
    ) {
      const next = { ...lastVisitedChild, [section.path]: child.path }
      writeStoredEntries(next)
      setLastVisitedChild(next)
    }
  }

  const getEntryPath = (item: NavItem): string => {
    if (!item.children || item.children.length <= 1) return item.path

    const recorded = lastVisitedChild[item.path]
    const isStillValid =
      recorded && item.children.some((child) => child.path === recorded)

    return isStillValid ? recorded : item.path
  }

  return { getEntryPath }
}

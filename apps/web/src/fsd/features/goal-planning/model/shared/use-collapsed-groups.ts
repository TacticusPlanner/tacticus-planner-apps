import { startTransition, useCallback, useState } from "react"

import { safeStorage } from "@/shared/lib"

const STORAGE_KEY = "goals.overview.collapsedGroups"

function readCollapsed(): ReadonlySet<string> {
  const raw = safeStorage.get(STORAGE_KEY)
  if (!raw) return new Set()
  try {
    const parsed: unknown = JSON.parse(raw)
    return new Set(
      Array.isArray(parsed)
        ? parsed.filter((id): id is string => typeof id === "string")
        : []
    )
  } catch {
    return new Set()
  }
}

/**
 * Which Goals sections (by `rowGroupId`) the player has collapsed. Persisted per browser like the
 * Group selection itself, so a long plan stays folded the way the player left it across visits.
 *
 * A toggle re-renders the whole Goals page (the shown rows and the selection follow it), so it runs
 * in a transition: the section's own chevron flips at once and the list catches up after the paint.
 */
export function useCollapsedGroups() {
  const [collapsed, setCollapsed] = useState(readCollapsed)
  const toggleCollapsed = useCallback((groupId: string) => {
    startTransition(() => {
      setCollapsed((prev) => {
        const next = new Set(prev)
        if (!next.delete(groupId)) next.add(groupId)
        // Best-effort — the in-memory value still updates.
        safeStorage.set(STORAGE_KEY, JSON.stringify([...next]))
        return next
      })
    })
  }, [])
  return { collapsed, toggleCollapsed }
}

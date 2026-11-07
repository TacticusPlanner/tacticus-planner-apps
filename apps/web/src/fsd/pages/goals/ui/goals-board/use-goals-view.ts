import { useSyncExternalStore } from "react"

import { safeStorage } from "@/shared/lib"

export type GoalsView = "Cards" | "Table"

const STORAGE_KEY = "goals.overview.view"
const listeners = new Set<() => void>()

/** Holds the choice for this visit when the browser refuses the write (browser-storage-resilience). */
let unsavedView: GoalsView | null = null

function readView(): GoalsView {
  if (unsavedView) return unsavedView
  return safeStorage.get(STORAGE_KEY) === "Table" ? "Table" : "Cards"
}

function setView(next: GoalsView) {
  unsavedView = safeStorage.trySet(STORAGE_KEY, next) ? null : next
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  // Fires only for other tabs; `key` is null when they clear storage.
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) listener()
  }
  listeners.add(listener)
  window.addEventListener("storage", onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener("storage", onStorage)
  }
}

/**
 * This browser's Goals view (goal-list-layout: Cards by default, stored per device). A store rather
 * than `usePersistedSelection`, because `GoalsLayout` and `GoalsPage` both read it and a toggle in the
 * page must reach the layout's width cap at once.
 */
export function useGoalsView() {
  return { view: useSyncExternalStore(subscribe, readView), setView }
}

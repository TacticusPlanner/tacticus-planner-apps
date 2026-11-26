import type { ProjectSummary } from "../types"
import { safeStorage, storageKeys } from "@/shared/lib"

/**
 * The one project selection every project-scoped page shares (Dailies, Plan > Schedule, Plan >
 * Insights), so picking a project on one keeps it picked on the others and after a reload. It is the
 * signed-in account's data (a project id), so it sits under the account prefix and sign-out drops it.
 */
export const SELECTED_PROJECT_STORAGE_KEY = storageKeys.userSelectedProject

const listeners = new Set<() => void>()
// Holds the selection for this visit only when the browser refuses the write (spec:
// browser-storage-resilience); `undefined` means "read storage".
let unsavedSelection: string | null | undefined

function notify() {
  for (const listener of listeners) listener()
}

export function subscribeSelectedProject(listener: () => void): () => void {
  listeners.add(listener)
  // Another tab changing the selection (or clearing storage) shows up here too.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== SELECTED_PROJECT_STORAGE_KEY && event.key !== null) return
    unsavedSelection = undefined
    listener()
  }
  window.addEventListener("storage", onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener("storage", onStorage)
  }
}

export function readStoredProjectId(): string | null {
  return unsavedSelection === undefined
    ? safeStorage.get(SELECTED_PROJECT_STORAGE_KEY)
    : unsavedSelection
}

/** Stores the selection; `undefined` is "All goals", which clears it. */
export function writeStoredProjectId(projectId: string | undefined): void {
  if (projectId) {
    unsavedSelection = safeStorage.trySet(
      SELECTED_PROJECT_STORAGE_KEY,
      projectId
    )
      ? undefined
      : projectId
  } else {
    safeStorage.remove(SELECTED_PROJECT_STORAGE_KEY)
    unsavedSelection = undefined
  }
  notify()
}

export type ProjectListState = "loading" | "ready" | "unavailable"

/**
 * The selection a page applies. A stored project the loaded list no longer has (deleted, archived, or
 * another account's) falls back to "All goals". While the list loads the stored id is applied as is,
 * so a page doesn't plan every goal first and then switch; a failed or absent list applies nothing.
 */
export function resolveSelectedProjectId(
  storedProjectId: string | null,
  projects: readonly ProjectSummary[],
  listState: ProjectListState
): string | undefined {
  if (!storedProjectId) return undefined
  if (listState === "loading") return storedProjectId
  if (listState === "unavailable") return undefined
  return projects.some(
    (project) =>
      project.projectId === storedProjectId && project.status !== "Archived"
  )
    ? storedProjectId
    : undefined
}

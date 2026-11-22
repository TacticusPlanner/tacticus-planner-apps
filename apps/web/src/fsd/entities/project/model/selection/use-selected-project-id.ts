import { useSyncExternalStore } from "react"

import type { ProjectSummary } from "../types"
import {
  readStoredProjectId,
  resolveSelectedProjectId,
  subscribeSelectedProject,
  writeStoredProjectId,
} from "./selected-project"

type ProjectsRead = {
  projects: ProjectSummary[]
  fetchState: { status: "idle" | "error" | "success" }
  loading: boolean
}

/**
 * The shared, persisted project selection (see `selected-project.ts`) resolved against the loaded
 * project list from `useProjects()`. Every `ProjectSelect` that scopes a page by project should use
 * this, so the choice follows the player across pages and reloads.
 */
export function useSelectedProjectId(
  projectsRead: ProjectsRead
): [string | undefined, (projectId: string | undefined) => void] {
  const stored = useSyncExternalStore(
    subscribeSelectedProject,
    readStoredProjectId
  )
  const listState =
    projectsRead.fetchState.status === "success"
      ? "ready"
      : projectsRead.loading
        ? "loading"
        : "unavailable"
  return [
    resolveSelectedProjectId(stored, projectsRead.projects, listState),
    writeStoredProjectId,
  ]
}

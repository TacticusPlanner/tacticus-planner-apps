import { ApiError } from "@/shared/api"

import type { ProjectSummary } from "./types"

/** The API's cap on non-archived projects per account; archiving one frees a slot. */
export const MAX_PROJECTS = 100

/** Whether `projects` already hold the cap, so creating another would be refused. */
export function isAtProjectLimit(
  projects: readonly Pick<ProjectSummary, "status">[]
): boolean {
  return (
    projects.filter((project) => project.status !== "Archived").length >=
    MAX_PROJECTS
  )
}

/** Whether `error` is the API's 400 `projectLimitReached`. */
export function isProjectLimitError(error: unknown): boolean {
  return error instanceof ApiError && error.issueCode === "projectLimitReached"
}

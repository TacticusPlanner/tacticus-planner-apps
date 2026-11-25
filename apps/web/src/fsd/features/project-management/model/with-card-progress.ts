import type { ProjectCardStatus, ProjectCardSummary } from "../ui/project-row"

/** The card summaries with each live project's status line facts merged in. */
export function withCardProgress(
  summaries: ReadonlyMap<string, ProjectCardSummary>,
  progress: ReadonlyMap<string, ProjectCardStatus>
): ReadonlyMap<string, ProjectCardSummary> {
  const merged = new Map(summaries)
  for (const [projectId, summary] of summaries) {
    const status = progress.get(projectId)
    if (summary.status === "success" && status) {
      merged.set(projectId, { ...summary, progress: status })
    }
  }
  return merged
}

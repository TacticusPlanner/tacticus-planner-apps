/** The names of the projects in `next` that `previous` did not hold, in `next`'s order. */
export function addedProjectNames(
  previous: readonly string[],
  next: readonly string[],
  projects: readonly { projectId: string; name: string }[]
): string[] {
  const before = new Set(previous)
  return next
    .filter((projectId) => !before.has(projectId))
    .flatMap((projectId) => {
      const project = projects.find(
        (candidate) => candidate.projectId === projectId
      )
      return project ? [project.name] : []
    })
}

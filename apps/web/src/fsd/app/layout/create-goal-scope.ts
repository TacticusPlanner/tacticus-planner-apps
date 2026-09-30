/** The project a global Create Goal entry point (sidebar, bottom nav, Ctrl/Cmd+G) preselects: the
 * Goals page's `?project=` scope, and nothing anywhere else (`goal-creation-entry-points`). The id
 * is not validated here - the Goals page already drops an unknown one from its own URL. */
export function createGoalScopeProjectId(
  pathname: string,
  search: string
): string | undefined {
  if (pathname !== "/plan/goals") return undefined
  return new URLSearchParams(search).get("project") ?? undefined
}

// TEMPORARY: the Plan section moved from `/goals/*` to `/plan/*` (change
// `consolidate-goals-into-plan-and-remove-active-project`). This keeps shared links, bookmarks and
// stored login `next` values working; delete it (and its route in `routes.tsx` and the call in
// `resolve-next-path.ts`) once old links no longer matter.
const LEGACY_GOALS_PATH = /^\/goals(\/[^?#]*)?([?#].*)?$/

/** Maps a legacy `/goals...` path (query and hash kept) to its `/plan...` equivalent; any other path is returned as is. */
export function mapLegacyGoalsPath(path: string): string {
  const match = LEGACY_GOALS_PATH.exec(path)
  if (!match) return path
  const rest = (match[1] ?? "").replace(/^\/|\/$/g, "")
  // `/goals/plan` (the never-shipped Global Plan) and `/goals/overview` both became the Goals page.
  const child = ["", "plan", "overview"].includes(rest) ? "goals" : rest
  return `/plan/${child}${match[2] ?? ""}`
}

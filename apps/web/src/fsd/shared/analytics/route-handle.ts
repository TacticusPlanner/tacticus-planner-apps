/**
 * Route `handle` for a route that only sends the visitor on to another page (its element is a
 * `<Navigate replace>`): it reports no page_view of its own, so only the page the visitor lands on
 * is counted. A page_view is otherwise sent as soon as a route matches, while the lazy section
 * layout is still loading and before the redirect has even rendered, which counted a view of the
 * bare section path (`/plan/`, `/dailies/`) for every visit to the page it leads to.
 */
export const redirectOnlyHandle = { pageView: false } as const

/** Whether a matched route's `handle` lets it report a page_view (see `redirectOnlyHandle`). */
export function reportsPageView(handle: unknown): boolean {
  if (typeof handle !== "object" || handle === null) return true
  return !("pageView" in handle) || handle.pageView !== false
}

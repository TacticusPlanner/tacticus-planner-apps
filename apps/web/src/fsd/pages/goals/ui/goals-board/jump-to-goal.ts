/** Scrolls a goal's row or card into view and focuses it, for a "Covered by" note's link. Returns
 *  false when the goal isn't on screen (filtered out, in a collapsed group, or on another tab), so the
 *  caller can open the goal instead. Under reduced motion the scroll is instant. */
export function jumpToGoalRow(goalId: string, root: ParentNode = document) {
  const target = root.querySelector<HTMLElement>(
    `[data-testid="goal-row"][data-goal-id="${CSS.escape(goalId)}"]`
  )
  if (!target) return false
  const reducedMotion =
    "matchMedia" in globalThis &&
    globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches
  target.scrollIntoView({
    behavior: reducedMotion ? "auto" : "smooth",
    block: "center",
  })
  target.focus({ preventScroll: true })
  return true
}

/**
 * Runs `work` in a new task after the browser's next paint, so a tap's own feedback (a menu
 * closing, a button pressing) paints before heavy work starts. That paint is what INP measures.
 * Use it for work whose result may land a frame later; never for anything the tap must show at
 * once. Falls back to a plain timeout where there is no `requestAnimationFrame` (tests, SSR).
 */
export function afterNextPaint(work: () => void): void {
  if (typeof requestAnimationFrame !== "function") {
    setTimeout(work, 0)
    return
  }
  requestAnimationFrame(() => setTimeout(work, 0))
}

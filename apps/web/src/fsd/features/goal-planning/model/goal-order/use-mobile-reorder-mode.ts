import { useCallback, useEffect, useRef, useState } from "react"

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches

/**
 * The mobile reorder mode of a goal list: a toggle plus a ref for the list it reorders. Turning the
 * mode on brings the list into the visible viewport and moves focus to it — without smooth scrolling
 * when the user prefers reduced motion — so a user who started from the page header is not left
 * looking at a list that is off screen. Turning it off (Done, or leaving) only exits the mode: every
 * completed drop has already been saved, so nothing needs committing.
 */
export function useMobileReorderMode() {
  const [active, setActive] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const exit = useCallback(() => setActive(false), [])

  useEffect(() => {
    if (!active) return
    const list = listRef.current
    if (!list) return
    list.scrollIntoView?.({
      block: "start",
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    })
    list.focus({ preventScroll: true })
  }, [active])

  return {
    active,
    toggle: () => setActive((current) => !current),
    exit,
    listRef,
  }
}

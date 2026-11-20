import { useCallback, useState, useSyncExternalStore } from "react"

export interface ScrollOverflow {
  /** Content is hidden past the left edge. */
  start: boolean
  /** Content is hidden past the right edge. */
  end: boolean
}

const none: ScrollOverflow = { start: false, end: false }

/** Which edges of a sideways-scrolling element hide content, kept current as it scrolls or resizes.
 *  Pass the returned callback as the element's `ref`. */
export function useScrollOverflow(): [
  ScrollOverflow,
  (element: HTMLElement | null) => void,
] {
  const [element, setElement] = useState<HTMLElement | null>(null)
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!element) return () => {}
      element.addEventListener("scroll", onChange, { passive: true })
      const observer =
        typeof ResizeObserver === "undefined"
          ? undefined
          : new ResizeObserver(onChange)
      observer?.observe(element)
      for (const child of element.children) observer?.observe(child)
      return () => {
        element.removeEventListener("scroll", onChange)
        observer?.disconnect()
      }
    },
    [element]
  )
  const overflow = useSyncExternalStore(
    subscribe,
    () => (element ? readOverflow(element) : none),
    () => none
  )

  return [overflow, setElement]
}

// One object per combination, so the snapshot is stable while nothing changes.
const overflowStates: Record<`${boolean}:${boolean}`, ScrollOverflow> = {
  "false:false": none,
  "true:false": { start: true, end: false },
  "false:true": { start: false, end: true },
  "true:true": { start: true, end: true },
}

function readOverflow(element: HTMLElement): ScrollOverflow {
  const { scrollLeft, scrollWidth, clientWidth } = element
  // A pixel of slack absorbs fractional widths.
  const start = scrollLeft > 1
  const end = scrollLeft + clientWidth < scrollWidth - 1
  return overflowStates[`${start}:${end}`]
}

/** A CSS mask that fades the edges hiding content, so a cut-off row reads as scrollable. */
export function overflowMask({
  start,
  end,
}: ScrollOverflow): string | undefined {
  if (!start && !end) return undefined
  const left = start ? "transparent, black 2rem" : "black"
  const right = end ? "black calc(100% - 2rem), transparent" : "black"
  return `linear-gradient(to right, ${left}, ${right})`
}

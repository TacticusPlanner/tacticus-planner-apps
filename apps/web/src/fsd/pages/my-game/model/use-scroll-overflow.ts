import { useEffect, useState } from "react"

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
  const [overflow, setOverflow] = useState<ScrollOverflow>(none)

  useEffect(() => {
    if (!element) return
    const measure = () => {
      const { scrollLeft, scrollWidth, clientWidth } = element
      // A pixel of slack absorbs fractional widths.
      const next = {
        start: scrollLeft > 1,
        end: scrollLeft + clientWidth < scrollWidth - 1,
      }
      setOverflow((current) =>
        current.start === next.start && current.end === next.end
          ? current
          : next
      )
    }
    measure()
    element.addEventListener("scroll", measure, { passive: true })
    const observer =
      typeof ResizeObserver === "undefined"
        ? undefined
        : new ResizeObserver(measure)
    observer?.observe(element)
    for (const child of element.children) observer?.observe(child)
    return () => {
      element.removeEventListener("scroll", measure)
      observer?.disconnect()
    }
  }, [element])

  return [overflow, setElement]
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

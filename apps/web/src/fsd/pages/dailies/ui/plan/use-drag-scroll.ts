import { useEffect, type RefObject } from "react"

const DRAG_THRESHOLD_PX = 4

/** Mouse drag-to-scroll for a horizontally overflowing element. Touch keeps native scrolling, and a
 * drag past the threshold swallows the click that ends it so dragging over a control doesn't fire it. */
export function useDragScroll(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const element = ref.current
    if (!element) return
    let startX = 0
    let startScroll = 0
    let dragging = false
    let moved = false

    const onMove = (event: PointerEvent) => {
      const delta = event.clientX - startX
      if (!moved && Math.abs(delta) < DRAG_THRESHOLD_PX) return
      moved = true
      element.scrollLeft = startScroll - delta
    }
    const stop = () => {
      dragging = false
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", stop)
      window.removeEventListener("pointercancel", stop)
    }
    const onDown = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || event.button !== 0) return
      dragging = true
      moved = false
      startX = event.clientX
      startScroll = element.scrollLeft
      window.addEventListener("pointermove", onMove)
      window.addEventListener("pointerup", stop)
      window.addEventListener("pointercancel", stop)
    }
    const onClickCapture = (event: MouseEvent) => {
      if (!moved) return
      moved = false
      event.stopPropagation()
      event.preventDefault()
    }

    // Cell icons are <img>s: without this Chrome starts a native image drag that cancels the pointer
    // stream, so a drag beginning on a cell would never scroll the strip.
    const onDragStart = (event: DragEvent) => event.preventDefault()

    element.addEventListener("pointerdown", onDown)
    element.addEventListener("click", onClickCapture, true)
    element.addEventListener("dragstart", onDragStart)
    return () => {
      if (dragging) stop()
      element.removeEventListener("dragstart", onDragStart)
      element.removeEventListener("pointerdown", onDown)
      element.removeEventListener("click", onClickCapture, true)
    }
  }, [ref])
}

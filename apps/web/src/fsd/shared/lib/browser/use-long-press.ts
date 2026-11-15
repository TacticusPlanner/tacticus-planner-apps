import { useCallback, useEffect, useRef } from "react"
import type { MouseEvent, PointerEvent } from "react"

interface LongPressOptions {
  /** Called once the finger has stayed down for `delay` ms without moving away. */
  onLongPress: () => void
  delay?: number
  /** How far (px) the finger may drift before the press counts as a scroll and is dropped. */
  moveTolerance?: number
}

/** Handlers to spread on the pressed element. */
interface LongPressHandlers {
  onPointerDown: (event: PointerEvent) => void
  onPointerMove: (event: PointerEvent) => void
  onPointerUp: () => void
  onPointerCancel: () => void
  onClickCapture: (event: MouseEvent) => void
  onContextMenu: (event: MouseEvent) => void
}

/**
 * A touch long-press, for offering a control's details on touch without changing what a tap does.
 * Only touch pointers start it (mouse and pen keep hover); moving the finger past the tolerance or
 * lifting it early drops it, so dragging to scroll never fires. Once it fires, the click that ends
 * the same press is swallowed in the capture phase, so the element's own action, or an enclosing
 * button's, does not run too. The touch context menu (iOS callout, Android menu) is suppressed.
 */
export function useLongPress({
  onLongPress,
  delay = 450,
  moveTolerance = 10,
}: LongPressOptions): LongPressHandlers {
  const timer = useRef<number | undefined>(undefined)
  const start = useRef<{ x: number; y: number } | null>(null)
  const fired = useRef(false)
  const callback = useRef(onLongPress)
  useEffect(() => {
    callback.current = onLongPress
  }, [onLongPress])

  const cancel = useCallback(() => {
    window.clearTimeout(timer.current)
    timer.current = undefined
    start.current = null
  }, [])
  useEffect(() => cancel, [cancel])

  return {
    onPointerDown: (event) => {
      fired.current = false
      if (event.pointerType !== "touch") return
      cancel()
      start.current = { x: event.clientX, y: event.clientY }
      timer.current = window.setTimeout(() => {
        timer.current = undefined
        start.current = null
        fired.current = true
        callback.current()
      }, delay)
    },
    onPointerMove: (event) => {
      if (!start.current) return
      const dx = event.clientX - start.current.x
      const dy = event.clientY - start.current.y
      if (Math.hypot(dx, dy) > moveTolerance) cancel()
    },
    onPointerUp: () => {
      cancel()
      // The click that ends this press lands right after; past that, a later click (a keyboard
      // Enter, a new tap) must not be swallowed by a press that is already over.
      if (fired.current) {
        window.setTimeout(() => {
          fired.current = false
        }, 400)
      }
    },
    onPointerCancel: cancel,
    onClickCapture: (event) => {
      if (!fired.current) return
      fired.current = false
      event.preventDefault()
      event.stopPropagation()
    },
    onContextMenu: (event) => {
      if (fired.current || start.current) event.preventDefault()
    },
  }
}

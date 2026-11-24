import { useEffect, useEffectEvent } from "react"

/** While `active`, Escape anywhere on the page (outside a dialog or menu, which handle it first)
 *  calls `onEscape`: the desktop table's way to clear its selection, like Gmail. */
export function useEscapeToClear(active: boolean, onEscape: () => void) {
  const escape = useEffectEvent(onEscape)
  useEffect(() => {
    if (!active) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented) escape()
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [active])
}

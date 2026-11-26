import { useState } from "react"

import { closestOverlayContent } from "@/shared/ui"

/**
 * Keeps a select inside the dialog or sheet it opens from: pass `setTrigger` as the trigger's ref and
 * `onOpenChange` to the select; on open, `container` becomes the overlay content around the
 * trigger, for `SelectContent`'s `container` (a list portaled to `document.body` sits outside the
 * dialog's pointer-events scope). Outside an overlay it stays undefined, and the list portals to
 * the body as usual.
 */
export function useOverlayContainer() {
  const [trigger, setTrigger] = useState<HTMLElement | null>(null)
  const [container, setContainer] = useState<HTMLElement>()
  const onOpenChange = (open: boolean) => {
    if (open) setContainer(closestOverlayContent(trigger))
  }
  return { setTrigger, container, onOpenChange }
}

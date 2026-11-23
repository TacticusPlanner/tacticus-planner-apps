import { useState } from "react"

import { closestOverlayContent } from "@/shared/ui"

/**
 * Where a select inside the editor portals its list: the open Dialog or Sheet content around its
 * trigger. A list portaled to the body can be impossible to open under the dialog's scroll lock.
 */
export function useOverlayPortal() {
  const [trigger, setTrigger] = useState<HTMLButtonElement | null>(null)
  const [container, setContainer] = useState<HTMLElement>()
  const onOpenChange = (open: boolean) => {
    if (open) setContainer(closestOverlayContent(trigger))
  }
  return { triggerRef: setTrigger, container, onOpenChange }
}

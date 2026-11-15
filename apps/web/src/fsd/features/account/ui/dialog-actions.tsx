import { useContext, type ReactNode } from "react"
import { createPortal } from "react-dom"

import { DialogActionSlotContext } from "./dialog-action-slot"

/**
 * Renders a tab's main button in the dialog footer, beside Close. Only the open tab is mounted, so
 * the footer always shows that tab's button. Outside the dialog (e.g. a tab rendered on its own in
 * a test) the button stays where it is. A submit button moved out of its form must name the form
 * with the `form` attribute.
 */
export function DialogAction({ children }: { children: ReactNode }) {
  const slot = useContext(DialogActionSlotContext)
  return slot ? createPortal(children, slot) : children
}

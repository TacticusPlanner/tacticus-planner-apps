import { createContext } from "react"

/**
 * Height of the Account settings dialog's footer buttons: the 40px touch target on a touch
 * screen, the larger mouse size otherwise.
 */
export const dialogActionClassName = "h-10 w-full pointer-fine:h-9"

/** The footer element a tab's main button is rendered into, next to Close. */
export const DialogActionSlotContext = createContext<HTMLElement | null>(null)

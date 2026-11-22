import { createContext } from "react"

/**
 * A tab's main button in the Account settings footer. It is portaled into the footer, so it is not
 * a direct child there and takes the phone footer's half of the row itself (ui-style-guide rule 8).
 */
export const dialogActionClassName = "max-md:flex-1"

/** The footer element a tab's main button is rendered into, next to Cancel. */
export const DialogActionSlotContext = createContext<HTMLElement | null>(null)

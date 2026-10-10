import { useEffect, type ReactNode } from "react"
import { useBlocker } from "react-router"

import { ConfirmationDialog } from "./confirmation-dialog"

export type UnsavedChangesGuardProps = {
  when: boolean
  title: ReactNode
  description: ReactNode
  stayLabel: ReactNode
  leaveLabel: ReactNode
}

/**
 * While `when` is true, asks before leaving the page: in-app navigation to another path opens a
 * Stay/Leave confirmation, and closing or reloading the tab triggers the browser's own prompt.
 * Requires a data router (`createBrowserRouter`/`createMemoryRouter`).
 */
export function UnsavedChangesGuard({
  when,
  title,
  description,
  stayLabel,
  leaveLabel,
}: UnsavedChangesGuardProps) {
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      when && currentLocation.pathname !== nextLocation.pathname
  )

  useEffect(() => {
    if (!when) return
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      // Legacy browsers only show the prompt when returnValue is set.
      event.returnValue = ""
    }
    window.addEventListener("beforeunload", onBeforeUnload)
    return () => window.removeEventListener("beforeunload", onBeforeUnload)
  }, [when])

  return (
    <ConfirmationDialog
      open={blocker.state === "blocked"}
      title={title}
      description={description}
      confirmLabel={leaveLabel}
      cancelLabel={stayLabel}
      onConfirm={() => blocker.proceed?.()}
      onCancel={() => blocker.reset?.()}
    />
  )
}

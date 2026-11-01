import * as React from "react"

// The CloseWatcher API (Chromium 126+, including Android Chrome and installed PWAs) turns a
// platform "close request" - the Android Back button or gesture - into an event for the topmost
// watcher, without adding a history entry. TypeScript's DOM lib does not declare it yet.
interface CloseWatcherLike {
  onclose: (() => void) | null
  destroy(): void
}

type CloseWatcherConstructor = new () => CloseWatcherLike

function getCloseWatcher(): CloseWatcherConstructor | undefined {
  if (typeof window === "undefined") return undefined
  return (window as { CloseWatcher?: CloseWatcherConstructor }).CloseWatcher
}

/**
 * Until the returned release function runs, the Android Back button (and any other platform close
 * request) calls `onClose` instead of leaving the page - or, in the installed app with nothing
 * behind it, closing the app. Watchers stack, so Back closes the overlay opened last. Returns
 * undefined, leaving Back alone, where the browser has no CloseWatcher. For overlays React does
 * not render (a third-party widget); React overlays use the `Dialog`/`Sheet`/`Drawer` roots.
 */
export function watchCloseRequest(onClose: () => void) {
  const CloseWatcher = getCloseWatcher()
  if (!CloseWatcher) return undefined

  let watcher: CloseWatcherLike
  try {
    watcher = new CloseWatcher()
  } catch {
    // Throws when the document is not fully active; Back just keeps its default then.
    return undefined
  }
  watcher.onclose = onClose
  return () => {
    watcher.onclose = null
    watcher.destroy()
  }
}

/**
 * While `open`, Back calls `onClose` (see `watchCloseRequest`). Escape is unaffected: Radix handles
 * it and cancels the key, which keeps the watcher from firing for it.
 */
function useCloseOnBack(open: boolean, onClose: () => void) {
  const onCloseRef = React.useRef(onClose)
  // A watcher fires once. Bumped on each Back so an owner that keeps the overlay open (a dirty
  // form asking to confirm first) gets a fresh watcher for the next Back press.
  const [armed, setArmed] = React.useState(0)

  React.useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  React.useEffect(() => {
    if (!open) return
    return watchCloseRequest(() => {
      onCloseRef.current()
      setArmed((count) => count + 1)
    })
  }, [open, armed])
}

/**
 * Open state for an overlay root that may be controlled (`open` + `onOpenChange`) or uncontrolled
 * (`defaultOpen` and a trigger), with Back closing it while open. Returns the props to hand to the
 * primitive's root, which is then always controlled.
 */
export function useBackClosableOpenState({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
}: {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)
  const isControlled = openProp !== undefined
  const open = isControlled ? openProp : uncontrolledOpen

  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      if (!isControlled) setUncontrolledOpen(next)
      onOpenChange?.(next)
    },
    [isControlled, onOpenChange]
  )

  const close = React.useCallback(
    () => handleOpenChange(false),
    [handleOpenChange]
  )
  useCloseOnBack(open, close)

  return { open, onOpenChange: handleOpenChange }
}

import { useEffect, useState, useSyncExternalStore } from "react"

/** The open editor: what it was opened with, plus a fresh mount key so each opening starts from
 *  its own draft. */
type OpenTeamEditor<Request extends object> = Request & { key: number }

/**
 * A page's team editor as a small store outside React state. The page holds one stable instance,
 * so opening or closing the editor re-renders only what reads it (the editor host), not the whole
 * page. Before this, an open editor in page state re-rendered every section on each Add team or
 * Edit tap (INP P90 about 2 s on Add team, web vitals audit 2026-11-15). `Request` is what the page
 * opens the editor with: the team to edit, or a new team's starting point.
 */
export interface TeamEditorLauncher<Request extends object> {
  openTeamEditor: (request: Request) => void
  closeTeamEditor: () => void
  /** The open editor, or null. Read it in render through `useOpenTeamEditor`. */
  getEditor: () => OpenTeamEditor<Request> | null
  subscribe: (listener: () => void) => () => void
  /** The element focus returns to once the editor closes; set on open, taken by the host. */
  takeOpener: () => HTMLElement | null
}

/**
 * The element focus returns to when the editor closes: the opener, or — when the editor was opened
 * from a menu item, which unmounts with its menu — the button that opened that menu.
 */
function focusReturnTarget(active: Element | null): HTMLElement | null {
  if (!(active instanceof HTMLElement)) return null
  const menu = active.closest('[role="menu"]')
  if (menu?.id) {
    const trigger = document.querySelector(
      `[aria-controls="${CSS.escape(menu.id)}"]`
    )
    return trigger instanceof HTMLElement ? trigger : null
  }
  return active
}

function createTeamEditorLauncher<
  Request extends object,
>(): TeamEditorLauncher<Request> {
  let editor: OpenTeamEditor<Request> | null = null
  let count = 0
  let opener: HTMLElement | null = null
  const listeners = new Set<() => void>()
  const set = (next: OpenTeamEditor<Request> | null) => {
    editor = next
    for (const listener of listeners) listener()
  }
  return {
    openTeamEditor: (request) => {
      opener = focusReturnTarget(document.activeElement)
      count += 1
      set({ ...request, key: count })
    },
    closeTeamEditor: () => {
      if (editor) set(null)
    },
    getEditor: () => editor,
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    takeOpener: () => {
      const target = opener
      opener = null
      return target
    },
  }
}

/** One launcher for the page's lifetime: the same object on every render. */
export function useTeamEditorLauncher<
  Request extends object,
>(): TeamEditorLauncher<Request> {
  const [launcher] = useState(createTeamEditorLauncher<Request>)
  return launcher
}

/** The open editor, or null; re-renders the caller when it opens or closes. Closing returns focus
 *  to the opener once the dialog has unmounted. Call it from one place: the editor host. */
export function useOpenTeamEditor<Request extends object>(
  launcher: TeamEditorLauncher<Request>
): OpenTeamEditor<Request> | null {
  const editor = useSyncExternalStore(launcher.subscribe, launcher.getEditor)
  // Focus goes back to the opener after the dialog's own focus scope has let go: its unmount
  // schedules a focus restore of its own, so this one runs in a later task.
  useEffect(() => {
    if (editor) return
    const target = launcher.takeOpener()
    if (!target) return
    const timer = setTimeout(() => {
      if (target.isConnected) target.focus()
    })
    return () => clearTimeout(timer)
  }, [editor, launcher])
  return editor
}

import { useEffect, useState, useSyncExternalStore } from "react"

/** The open editor: the team id to edit (null to create), with a fresh key per opening. */
export interface OpenTeamEditor {
  teamId: string | null
  key: number
}

/**
 * The page's team editor as a small store outside React state (the #620 pattern): opening or
 * closing it re-renders only the editor host, not the page and its cards.
 */
export interface TeamEditorLauncher {
  open: (teamId: string | null) => void
  close: () => void
  get: () => OpenTeamEditor | null
  subscribe: (listener: () => void) => () => void
  /** The element focus returns to once the editor closes. */
  takeOpener: () => HTMLElement | null
}

function createLauncher(): TeamEditorLauncher {
  let editor: OpenTeamEditor | null = null
  let count = 0
  let opener: HTMLElement | null = null
  const listeners = new Set<() => void>()
  const set = (next: OpenTeamEditor | null) => {
    editor = next
    for (const listener of listeners) listener()
  }
  return {
    open: (teamId) => {
      opener =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null
      count += 1
      set({ teamId, key: count })
    },
    close: () => {
      if (editor) set(null)
    },
    get: () => editor,
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

/** One launcher for the page's lifetime. */
export function useTeamEditorLauncher(): TeamEditorLauncher {
  const [launcher] = useState(createLauncher)
  return launcher
}

/** The open editor; re-renders only its caller. Closing returns focus to the opener. */
export function useOpenTeamEditor(
  launcher: TeamEditorLauncher
): OpenTeamEditor | null {
  const editor = useSyncExternalStore(launcher.subscribe, launcher.get)
  useEffect(() => {
    if (editor) return
    const target = launcher.takeOpener()
    if (!target) return
    // After the dialog's own focus restore, which runs as it unmounts.
    const timer = setTimeout(() => {
      if (target.isConnected) target.focus()
    })
    return () => clearTimeout(timer)
  }, [editor, launcher])
  return editor
}

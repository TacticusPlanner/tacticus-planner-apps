import { useEffect, useState, useSyncExternalStore } from "react"

import type {
  LegendaryEventLaneId,
  LegendaryEventTeam,
} from "@/entities/legendary-event"

/** What the team editor opens on (design D4): a lane, plus a saved team to edit, or a new team's
 *  first members (a suggestion's, or the leaderboard unit's) and a suggestion's objectives. */
interface TeamEditorRequest {
  laneId: LegendaryEventLaneId
  team?: LegendaryEventTeam
  memberUnitIds?: readonly string[]
  /** A new team's reserve (a suggestion's). */
  reserveUnitId?: string | null
  /** The objectives the picker's chips start from (the suggestion's). */
  objectiveIndexes?: readonly number[]
  /** The 1-based rank of the team suggestion the editor starts from. */
  suggestionRank?: number
}

/** The open editor: the request with a fresh mount key, so each opening starts from its draft. */
type OpenTeamEditor = TeamEditorRequest & { key: number }

/**
 * The page's team editor, as a small store outside React state. The page holds one stable
 * instance, so opening or closing the editor re-renders only what reads it (the editor host, and
 * a Teams section's suggestions dialog through `useTeamEditorSuggestionOpen`), not the whole event
 * page. Before this, the open editor lived in the page's state: every Add team, Edit, Use this
 * team or board chip tap rebuilt the page's view model and re-rendered every tab section in the
 * tap's frame (INP P90 about 2 s on Add team, web vitals audit 2026-11-15).
 */
export interface TeamEditorLauncher {
  openTeamEditor: (request: TeamEditorRequest) => void
  closeTeamEditor: () => void
  /** The open editor, or null. Read it in render through `useOpenTeamEditor`. */
  getEditor: () => OpenTeamEditor | null
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

function createTeamEditorLauncher(): TeamEditorLauncher {
  let editor: OpenTeamEditor | null = null
  let count = 0
  let opener: HTMLElement | null = null
  const listeners = new Set<() => void>()
  const set = (next: OpenTeamEditor | null) => {
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

/**
 * The page-level team editor (design D4): one editor for the event page, opened by the Teams
 * section (Add team, Edit, Use this team), the Event board and the leaderboards (Add to new team).
 * The returned launcher is the same object for the page's lifetime.
 */
export function useTeamEditorLauncher(): TeamEditorLauncher {
  const [launcher] = useState(createTeamEditorLauncher)
  return launcher
}

/** The open editor, or null; re-renders the caller when it opens or closes. Closing returns focus
 *  to the opener once the dialog has unmounted. Call it from one place: the editor host. */
export function useOpenTeamEditor(
  launcher: TeamEditorLauncher
): OpenTeamEditor | null {
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

/** Whether no editor opened from a team suggestion is showing, so the Suggest teams dialog can
 *  stay open behind any other editor and step aside for a suggestion's. Re-renders the caller only
 *  when that answer changes. */
export function useTeamEditorSuggestionOpen(
  launcher: TeamEditorLauncher
): boolean {
  return useSyncExternalStore(
    launcher.subscribe,
    () => launcher.getEditor()?.suggestionRank !== undefined
  )
}

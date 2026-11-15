import { useState, useSyncExternalStore } from "react"

/** A campaign location's name as its raid row shows it (see `CampaignLocationName`). */
interface CampaignBattleTitle {
  campaignName: string
  difficultyLabel?: string
  nodeLabel?: string
}

/** The campaign battle the dialog shows, with the name its row already displays. */
export interface CampaignBattleTarget {
  battleId: string
  title: CampaignBattleTitle
}

/**
 * Which campaign battle the dialog shows, kept outside React state. A page holds one stable
 * instance and hands `show` to its raid rows, so opening or closing the dialog re-renders only
 * `CampaignBattleDialogHost`, not the page that lists the raids. Before this, the shown battle was
 * page state on Today, Home's Raids card, HSE and HRE: every tap on a location's info button
 * re-rendered the whole raid list (web vitals audit 2026-11-15).
 */
export interface CampaignBattleDialogStore {
  show: (target: CampaignBattleTarget) => void
  close: () => void
  getTarget: () => CampaignBattleTarget | null
  subscribe: (listener: () => void) => () => void
}

function createCampaignBattleDialogStore(): CampaignBattleDialogStore {
  let target: CampaignBattleTarget | null = null
  const listeners = new Set<() => void>()
  const set = (next: CampaignBattleTarget | null) => {
    target = next
    for (const listener of listeners) listener()
  }
  return {
    show: (next) => set(next),
    close: () => {
      if (target) set(null)
    },
    getTarget: () => target,
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}

/** One campaign battle dialog for the calling page; the same object for the page's lifetime. */
export function useCampaignBattleDialog(): CampaignBattleDialogStore {
  const [store] = useState(createCampaignBattleDialogStore)
  return store
}

/** The battle the dialog shows, or null; re-renders the caller when it opens or closes. */
export function useCampaignBattleTarget(
  store: CampaignBattleDialogStore
): CampaignBattleTarget | null {
  return useSyncExternalStore(store.subscribe, store.getTarget)
}

import { useCallback, useEffect } from "react"

import type { LegendaryEventProgress } from "@/entities/legendary-event"
import { useAnalyticsActions } from "@/shared/analytics"
import { accountStorageKey, safeStorage } from "@/shared/lib"

import {
  forgetShownToken,
  rememberShownToken,
  settleShownTokens,
  tokenClearedEvent,
  type ShownToken,
} from "./token-cleared-analytics"
import type { ReadValue } from "./legendary-event-page.view-model"

function storageKey(eventId: string): string {
  return accountStorageKey(`lre.shownTokens.${eventId}`)
}

function load(eventId: string): ShownToken[] {
  const raw = safeStorage.get(storageKey(eventId))
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as ShownToken[]) : []
  } catch {
    return []
  }
}

function save(eventId: string, tokens: readonly ShownToken[]): void {
  if (tokens.length === 0) safeStorage.remove(storageKey(eventId))
  else safeStorage.set(storageKey(eventId), JSON.stringify(tokens))
}

/**
 * Remembers the Next tokens the card shows (per account and event, in local storage) and sends
 * `legendary_event_token_cleared` once synced progress shows one cleared; `forget` drops a token a
 * card action reported as falling short.
 */
export function useShownTokens(
  eventId: string,
  run: number | null,
  progress: ReadValue<LegendaryEventProgress | undefined>
) {
  const { captureEvent, isReady } = useAnalyticsActions()
  useEffect(() => {
    if (progress === "loading" || progress === "error") return
    const tokens = load(eventId)
    if (tokens.length === 0) return
    if (!isReady) {
      // A capture before the SDK loads is dropped: keep this run's tokens until it can be sent.
      const current = tokens.filter((token) => token.run === run)
      if (current.length !== tokens.length) save(eventId, current)
      return
    }
    const { cleared, kept } = settleShownTokens(tokens, progress, run)
    for (const token of cleared) {
      captureEvent(tokenClearedEvent(eventId, token))
    }
    if (kept.length !== tokens.length) save(eventId, kept)
  }, [captureEvent, eventId, isReady, progress, run])
  const remember = useCallback(
    (token: ShownToken) =>
      save(eventId, rememberShownToken(load(eventId), token)),
    [eventId]
  )
  const forget = useCallback(
    (battle: Pick<ShownToken, "laneId" | "battleIndex">) =>
      save(eventId, forgetShownToken(load(eventId), battle)),
    [eventId]
  )
  return { remember, forget }
}

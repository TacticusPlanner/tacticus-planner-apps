import { useCallback, useEffect, useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import type { Alliance } from "@workspace/game-domain"
import type { EventsCalendarStorageModel } from "@workspace/game-catalog"
import {
  getCharactersMap,
  getEventDefinitions,
  getUpcomingEvents,
  hasEventsCalendarSynced,
} from "@workspace/game-catalog/queries"

import { selectHreInstance, type HreInstance } from "./hre-instance"

const DAY_MS = 86_400_000
/** An HRE lasts 14 days; reading a little further back finds one that is still running. */
const LOOKBACK_DAYS = 30
const LOOKAHEAD_DAYS = 120
const TICK_MS = 60_000

/** The featured hero, when `featuredCharacterId` resolves to a catalog character. */
export type HreFeaturedHero = {
  id: string
  name: string
  alliance: (typeof Alliance)[keyof typeof Alliance]
  /** The rarity the hero unlocks at, which decides the first pace step. */
  initialRarity: string
}

export type HreInstanceState =
  | { status: "loading" }
  | { status: "error"; retry: () => void }
  | {
      status: "ready"
      instance: HreInstance<EventsCalendarStorageModel> | null
      hero: HreFeaturedHero | null
      /** The instant the selection was made at, for countdowns (render stays pure). */
      nowMs: number
    }

type LoadedState =
  Exclude<HreInstanceState, { status: "error" }> | { status: "error" }

// `useLiveQuery` has no error channel, so the querier resolves a tagged result instead.
async function load(nowMs: number): Promise<LoadedState> {
  try {
    if (!(await hasEventsCalendarSynced())) return { status: "loading" }
    const [definitions, entries, characters] = await Promise.all([
      getEventDefinitions(),
      getUpcomingEvents(
        new Date(nowMs - LOOKBACK_DAYS * DAY_MS),
        new Date(nowMs + LOOKAHEAD_DAYS * DAY_MS)
      ),
      getCharactersMap(),
    ])
    const definitionsById = new Map(
      definitions.map((definition) => [definition.id, definition])
    )
    const instance = selectHreInstance(entries, definitionsById, nowMs)
    const character = instance?.featuredCharacterId
      ? characters.get(instance.featuredCharacterId as never)
      : undefined
    const hero: HreFeaturedHero | null = character
      ? {
          id: character.id,
          name: character.name,
          alliance: character.alliance,
          initialRarity: character.initialRarity,
        }
      : null
    return { status: "ready", instance, hero, nowMs }
  } catch {
    return { status: "error" }
  }
}

/** The running Hero Release Event, else the next one, with its featured hero. */
export function useHreInstance(): HreInstanceState {
  // A coarse tick re-selects across an event boundary without a reload.
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setTick((value) => value + 1), TICK_MS)
    return () => clearInterval(timer)
  }, [])
  const result = useLiveQuery(() => load(Date.now()), [tick])
  const retry = useCallback(() => setTick((value) => value + 1), [])
  if (!result) return { status: "loading" }
  return result.status === "error" ? { status: "error", retry } : result
}

/** Whether an HRE is running now, for the navigation's live indicator (never true while loading). */
export function useIsHreLive(): boolean {
  const state = useHreInstance()
  return state.status === "ready" && state.instance?.status === "running"
}

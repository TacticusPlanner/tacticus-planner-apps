import { useEffect, useMemo, useState } from "react"
import type { Alliance } from "@workspace/game-domain"
import type { EventsCalendarStorageModel } from "@workspace/game-catalog"
import { hasEventsCalendarSynced } from "@workspace/game-catalog/queries"

import { combineReadStates, useReadState } from "@/shared/lib"
import { toById, useCatalogDataset } from "@/shared/local-data"

import {
  listHreInstances,
  resolveHreSelection,
  selectHreInstance,
  type HreInstance,
} from "./hre-instance"
import { toHreRules, type HreRules } from "./hre-rules"

const DAY_MS = 86_400_000
/** How far back the calendar is read: past events stay reachable from the HRE switcher. */
const LOOKBACK_DAYS = 400
const LOOKAHEAD_DAYS = 400
const TICK_MS = 60_000

/** The featured hero, when `featuredCharacterId` resolves to a catalog character. */
export type HreFeaturedHero = {
  id: string
  name: string
  alliance: (typeof Alliance)[keyof typeof Alliance]
  faction: string
  /** The rarity the hero unlocks at, which decides the first pace step. */
  initialRarity: string
}

export type HreInstanceState =
  | { status: "loading" }
  | { status: "error"; retry: () => void }
  | {
      status: "ready"
      /** The shown instance: the requested one, else the running one, else the next one. */
      instance: HreInstance<EventsCalendarStorageModel> | null
      /** Every HRE instance in the horizon (running, upcoming, past), by start. */
      instances: HreInstance<EventsCalendarStorageModel>[]
      /** The key of the default instance (running, else next), or null without one. */
      defaultKey: string | null
      /** True when the requested key no longer resolves (the tab then drops it). */
      stale: boolean
      /** Each instance's featured hero by character id, for the switcher's options. */
      heroes: ReadonlyMap<string, HreFeaturedHero>
      hero: HreFeaturedHero | null
      /** The event's served missions and reward rules; null when the served data lacks a part the
       *  tracker needs (an unknown mission task, say). */
      rules: HreRules | null
      /** The instant the selection was made at, for countdowns (render stays pure). */
      nowMs: number
    }

/** Calendar rows whose window overlaps the lookback / lookahead around `nowMs`. */
function entriesAround(
  entries: readonly EventsCalendarStorageModel[],
  nowMs: number
) {
  const startMs = nowMs - LOOKBACK_DAYS * DAY_MS
  const endMs = nowMs + LOOKAHEAD_DAYS * DAY_MS
  return entries.filter(
    (entry) =>
      Date.parse(entry.startUtc) < endMs && Date.parse(entry.endUtc) > startMs
  )
}

const toHero = (character: HreFeaturedHero): HreFeaturedHero => ({
  id: character.id,
  name: character.name,
  alliance: character.alliance,
  faction: character.faction,
  initialRarity: character.initialRarity,
})

/**
 * The Hero Release Event the HRE tab shows, with its featured hero and served rules: the instance
 * `requestedKey` names, else the running one, else the next one. Also lists every instance in the
 * calendar horizon for the switcher.
 */
export function useHreInstance(
  requestedKey: string | null = null
): HreInstanceState {
  // A coarse tick re-selects from the cached calendar across an event boundary without a reload.
  const [nowMs, setNowMs] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), TICK_MS)
    return () => clearInterval(timer)
  }, [])
  const synced = useReadState(
    "events-calendar-synced",
    hasEventsCalendarSynced,
    []
  )
  const definitions = useCatalogDataset("event-definitions", toById)
  const calendar = useCatalogDataset("events-calendar")
  const characters = useCatalogDataset("characters", toById)
  const hre = useCatalogDataset("hre")
  const progression = useCatalogDataset("progression-rules")
  // Each read is stable while unchanged, so the combination is too.
  const read = useMemo(
    () =>
      combineReadStates(
        synced,
        definitions,
        calendar,
        characters,
        hre,
        progression
      ),
    [synced, definitions, calendar, characters, hre, progression]
  )

  return useMemo((): HreInstanceState => {
    if (read.status === "error") return { status: "error", retry: read.retry }
    if (read.status === "loading") return { status: "loading" }
    const [
      isSynced,
      definitionsById,
      entries,
      charactersById,
      hreRecords,
      progressionRules,
    ] = read.data
    if (!isSynced) return { status: "loading" }
    const around = entriesAround(entries, nowMs)
    const instances = listHreInstances(around, definitionsById, nowMs)
    const { instance, defaultInstance, stale } = resolveHreSelection(
      instances,
      selectHreInstance(around, definitionsById, nowMs),
      requestedKey
    )
    const heroes = new Map<string, HreFeaturedHero>()
    for (const { featuredCharacterId } of instances) {
      const character = featuredCharacterId
        ? charactersById.get(featuredCharacterId)
        : undefined
      if (character) heroes.set(character.id, toHero(character))
    }
    const hero = instance?.featuredCharacterId
      ? (heroes.get(instance.featuredCharacterId) ?? null)
      : null
    const rules =
      toHreRules(
        hreRecords,
        progressionRules,
        instance?.featuredCharacterId ?? null
      ) ?? null
    return {
      status: "ready",
      instance,
      instances,
      defaultKey: defaultInstance?.key ?? null,
      stale,
      heroes,
      hero,
      rules,
      nowMs,
    }
  }, [read, nowMs, requestedKey])
}

/** Whether an HRE is running now, for the navigation's live indicator (never true while loading). */
export function useIsHreLive(): boolean {
  const state = useHreInstance()
  return (
    state.status === "ready" &&
    state.instances.some((instance) => instance.status === "running")
  )
}

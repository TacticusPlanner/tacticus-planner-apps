import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useIsAuthenticated } from "@azure/msal-react"
import { useLiveQuery } from "dexie-react-hooks"
import {
  getCharacters,
  getEquipmentMap,
  getMows,
  getUnlockShardCosts,
} from "@workspace/game-catalog/queries"
import {
  getInventoryShards,
  getPlayerCharacters,
  getPlayerMows,
} from "@workspace/player-data/queries"

import {
  buildCollectionView,
  type CollectionCatalog,
  type CollectionRoster,
  type CollectionView,
} from "./collection-view"

export type CollectionViewState =
  | { status: "loading" }
  | { status: "catalogError"; retry: () => void }
  | { status: "ready"; view: CollectionView; retry: () => void }

// `useLiveQuery` turns a rejected querier into a permanent `undefined`, indistinguishable from
// "still loading" - the same sentinel the dailies recommendations use, so a Dexie failure surfaces
// as a retryable error instead of an endless spinner.
const LIVE_QUERY_ERROR = Symbol("live-query-error")

async function readCatalog(): Promise<
  CollectionCatalog | typeof LIVE_QUERY_ERROR
> {
  try {
    const [characters, mows, unlockShardCosts, equipmentRarity] =
      await Promise.all([
        getCharacters(),
        getMows(),
        getUnlockShardCosts(),
        getEquipmentMap(),
      ])
    return { characters, mows, unlockShardCosts, equipmentRarity }
  } catch {
    return LIVE_QUERY_ERROR
  }
}

async function readRoster(): Promise<CollectionRoster> {
  try {
    const [characters, mows, shards] = await Promise.all([
      getPlayerCharacters(),
      getPlayerMows(),
      getInventoryShards(),
    ])
    return { state: "signedIn", characters, mows, shards }
  } catch {
    return { state: "error" }
  }
}

/**
 * The Collection page's data: the catalog plus, for a signed-in user, their synced roster and
 * unowned-unit shard inventory. Both reads are live, so a sync that lands while the page is open
 * re-renders it with the new roster. Only a catalog failure blocks the page; a roster failure
 * still lists the catalog (`rosterState: "error"`). `retry` re-issues both reads.
 */
export function useCollectionView(): CollectionViewState {
  const { t, i18n } = useTranslation(["factions", "characters", "mows"])
  const isAuthenticated = useIsAuthenticated()
  const [attempt, setAttempt] = useState(0)
  const retry = useCallback(() => setAttempt((value) => value + 1), [])

  const catalog = useLiveQuery(() => readCatalog(), [attempt])
  const roster = useLiveQuery(
    (): Promise<CollectionRoster> =>
      isAuthenticated ? readRoster() : Promise.resolve({ state: "anonymous" }),
    [isAuthenticated, attempt]
  )

  const view = useMemo(() => {
    if (!catalog || catalog === LIVE_QUERY_ERROR || !roster) return undefined
    return buildCollectionView(catalog, roster, {
      // Falls back to the catalog name read with this catalog, so an untranslated unit never
      // shows (or sorts by) its raw id.
      unitName: (kind, id, fallback) =>
        t(`${kind === "character" ? "characters" : "mows"}:${id}`, {
          defaultValue: fallback,
        }),
      factionName: (id) => t(`factions:${id}`, { defaultValue: id }),
      locale: i18n.language,
    })
  }, [catalog, roster, t, i18n.language])

  if (catalog === LIVE_QUERY_ERROR) return { status: "catalogError", retry }
  if (!view) return { status: "loading" }
  return { status: "ready", view, retry }
}

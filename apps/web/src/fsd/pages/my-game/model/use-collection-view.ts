import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useIsAuthenticated } from "@azure/msal-react"

import { combineReadStates } from "@/shared/lib"
import { toById, useCatalogDataset, usePlayerChunk } from "@/shared/local-data"

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

const ANONYMOUS: CollectionRoster = { state: "anonymous" }
const ROSTER_ERROR: CollectionRoster = { state: "error" }

/**
 * The Collection page's data: the catalog plus, for a signed-in user, their synced roster and
 * unowned-unit shard inventory. A sync that lands while the page is open refreshes the reads it
 * wrote, re-rendering it with the new roster. Only a catalog failure blocks the page; a roster failure
 * still lists the catalog (`rosterState: "error"`). `retry` re-issues both reads.
 */
export function useCollectionView(): CollectionViewState {
  const { t, i18n } = useTranslation(["factions", "characters", "mows"])
  const isAuthenticated = useIsAuthenticated()
  const catalogRead = combineReadStates(
    useCatalogDataset("characters"),
    useCatalogDataset("mows"),
    useCatalogDataset("unlock-shard-costs"),
    useCatalogDataset("equipment", toById)
  )
  // Signed out, the player chunks are not consulted (sign-out deletes the player database anyway).
  const rosterRead = combineReadStates(
    usePlayerChunk("characters"),
    usePlayerChunk("mows"),
    usePlayerChunk("inventory-shards")
  )
  const [characters, mows, unlockShardCosts, equipmentRarity] =
    catalogRead.status === "ready" ? catalogRead.data : []
  const [playerCharacters, playerMows, shards] =
    rosterRead.status === "ready" ? rosterRead.data : []

  // Keyed on each dataset (each referentially stable while unchanged), not on the combined tuples.
  const catalog = useMemo<CollectionCatalog | undefined>(
    () =>
      characters && mows && unlockShardCosts && equipmentRarity
        ? { characters, mows, unlockShardCosts, equipmentRarity }
        : undefined,
    [characters, mows, unlockShardCosts, equipmentRarity]
  )
  const rosterStatus = isAuthenticated ? rosterRead.status : "anonymous"
  const roster = useMemo<CollectionRoster | undefined>(() => {
    if (rosterStatus === "anonymous") return ANONYMOUS
    if (rosterStatus === "error") return ROSTER_ERROR
    if (rosterStatus === "loading") return undefined
    return {
      state: "signedIn",
      characters: playerCharacters ?? undefined,
      mows: playerMows ?? undefined,
      shards: shards ?? undefined,
    }
  }, [rosterStatus, playerCharacters, playerMows, shards])
  const retry = () => {
    catalogRead.retry()
    rosterRead.retry()
  }

  const view = useMemo(() => {
    if (!catalog || !roster) return undefined
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

  if (catalogRead.status === "error") return { status: "catalogError", retry }
  if (!view) return { status: "loading" }
  return { status: "ready", view, retry }
}

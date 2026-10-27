import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useIsAuthenticated } from "@azure/msal-react"
import type {
  CharacterStorageModel,
  UpgradeStorageModel,
} from "@workspace/game-catalog"
import { maxRankForProgression } from "@workspace/game-domain"
import type { PlayerDataChunkDto } from "@workspace/player-data"

import {
  inventoryBaseUpgrades,
  mapCharacterStorageToDomain,
  mapUpgradeStorageToDomain,
  rankUpReadiness,
} from "@/features/rank-lookup"
import { combineReadStates, type ReadState } from "@/shared/lib"
import { toById, useCatalogDataset, usePlayerChunk } from "@/shared/local-data"

import {
  collectionQuickFilters,
  defaultCollectionQuery,
  type CollectionQuery,
  type CollectionQuickFilter,
} from "./collection-query"
import { ascensionLadder } from "./collection-quick-filters"
import {
  buildCollectionView,
  type CollectionCatalog,
  type CollectionRoster,
  type CollectionView,
} from "./collection-view"

/**
 * Whether a quick filter can be offered: `needsRoster` without a synced roster, `needsInventory`
 * while the inventory it reads has not synced or could not be read, `failed` when its catalog data
 * could not be loaded, `loading` while either is still being read.
 */
export type QuickFilterAvailability =
  "available" | "loading" | "needsRoster" | "needsInventory" | "failed"

export type CollectionViewState =
  | { status: "loading" }
  | { status: "catalogError"; retry: () => void }
  | {
      status: "ready"
      view: CollectionView
      quickFilters: Record<CollectionQuickFilter, QuickFilterAvailability>
      retry: () => void
    }

/** Quick filters that read only the roster and the catalog's units, so need no extra data. */
const rosterOnlyQuickFilters = new Set<CollectionQuickFilter>([
  "needToAscend",
  "needToLevel",
  "missingEquipment",
  "abilitiesBehindLevel",
])

const ANONYMOUS: CollectionRoster = { state: "anonymous" }
const ROSTER_ERROR: CollectionRoster = { state: "error" }

const toUpgradesById = (records: UpgradeStorageModel[]) =>
  new Map(
    records.map((record) => [record.id, mapUpgradeStorageToDomain(record)])
  )

/**
 * The Collection page's data: the catalog plus, for a signed-in user, their synced roster and
 * unowned-unit shard inventory, listed through `query`. A sync that lands while the page is open
 * refreshes the reads it wrote, re-rendering it with the new roster. Only a catalog failure blocks
 * the page; a roster failure still lists the catalog (`rosterState: "error"`), and the quick
 * filters' own data (ascension costs, orbs, upgrade recipes and inventory) only gates those
 * filters. `retry` re-issues the reads.
 */
export function useCollectionView(
  query: CollectionQuery = defaultCollectionQuery
): CollectionViewState {
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
  const ladderRead = useCatalogDataset("ascension-costs", ascensionLadder)
  const upgradesRead = useCatalogDataset("upgrades", toUpgradesById)
  const inventoryRead = usePlayerChunk("inventory")
  const inventoryUpgradesRead = usePlayerChunk("inventory-upgrades")

  const [characters, mows, unlockShardCosts, equipmentRarity] =
    catalogRead.status === "ready" ? catalogRead.data : []
  const [playerCharacters, playerMows, shards] =
    rosterRead.status === "ready" ? rosterRead.data : []
  const ladder = ladderRead.status === "ready" ? ladderRead.data : undefined
  const orbs =
    inventoryRead.status === "ready" ? inventoryRead.data?.orbs : undefined

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
  const rosterAvailable =
    roster?.state === "signedIn" &&
    roster.characters !== undefined &&
    roster.mows !== undefined

  const quickFilters = useMemo(() => {
    const progression = availability(rosterAvailable, ladderRead, inventoryRead)
    const rankUp = availability(
      rosterAvailable,
      upgradesRead,
      inventoryUpgradesRead
    )
    return Object.fromEntries(
      collectionQuickFilters.map((quick) => [
        quick,
        rosterOnlyQuickFilters.has(quick)
          ? rosterAvailable
            ? "available"
            : "needsRoster"
          : quick === "readyToRankUp"
            ? rankUp
            : progression,
      ])
    ) as Record<CollectionQuickFilter, QuickFilterAvailability>
  }, [
    rosterAvailable,
    ladderRead,
    inventoryRead,
    upgradesRead,
    inventoryUpgradesRead,
  ])
  const quickStatus = query.quick ? quickFilters[query.quick] : undefined
  // A quick filter that cannot be offered does not narrow the list; one still loading holds it.
  const effectiveQuery = useMemo(
    () =>
      query.quick && quickStatus !== "available" && quickStatus !== "loading"
        ? { ...query, quick: null }
        : query,
    [query, quickStatus]
  )

  const upgradesById =
    upgradesRead.status === "ready" ? upgradesRead.data : undefined
  const inventoryUpgrades =
    inventoryUpgradesRead.status === "ready"
      ? inventoryUpgradesRead.data
      : undefined
  const rankUpReady = useMemo(
    () =>
      effectiveQuery.quick === "readyToRankUp" &&
      characters &&
      upgradesById &&
      inventoryUpgrades
        ? readyToRankUp(
            characters,
            playerCharacters ?? [],
            inventoryUpgrades,
            upgradesById
          )
        : undefined,
    [
      effectiveQuery.quick,
      characters,
      playerCharacters,
      inventoryUpgrades,
      upgradesById,
    ]
  )

  const retry = () => {
    catalogRead.retry()
    rosterRead.retry()
    ladderRead.retry()
    upgradesRead.retry()
    inventoryRead.retry()
    inventoryUpgradesRead.retry()
  }

  const view = useMemo(() => {
    if (!catalog || !roster) return undefined
    return buildCollectionView(
      catalog,
      roster,
      {
        // Falls back to the catalog name read with this catalog, so an untranslated unit never
        // shows (or sorts by) its raw id.
        unitName: (kind, id, fallback) =>
          t(`${kind === "character" ? "characters" : "mows"}:${id}`, {
            defaultValue: fallback,
          }),
        factionName: (id) => t(`factions:${id}`, { defaultValue: id }),
        locale: i18n.language,
      },
      effectiveQuery,
      { ladder, orbs, rankUpReady }
    )
  }, [
    catalog,
    roster,
    t,
    i18n.language,
    effectiveQuery,
    ladder,
    orbs,
    rankUpReady,
  ])

  if (catalogRead.status === "error") return { status: "catalogError", retry }
  if (!view || quickStatus === "loading") return { status: "loading" }
  return { status: "ready", view, quickFilters, retry }
}

/** A quick filter's availability from the catalog data and the inventory chunk it reads. */
function availability(
  rosterAvailable: boolean,
  catalogData: ReadState<unknown>,
  inventory: ReadState<unknown>
): QuickFilterAvailability {
  if (!rosterAvailable) return "needsRoster"
  if (catalogData.status === "error") return "failed"
  if (inventory.status === "error") return "needsInventory"
  if (catalogData.status === "loading" || inventory.status === "loading")
    return "loading"
  return inventory.status === "ready" && inventory.data != null
    ? "available"
    : "needsInventory"
}

/** The owned characters below their rarity's maximum rank whose current rank the inventory can
 *  finish (see `rankUpReadiness`). */
function readyToRankUp(
  characters: readonly CharacterStorageModel[],
  playerCharacters: PlayerDataChunkDto<"characters">,
  inventoryUpgrades: PlayerDataChunkDto<"inventory-upgrades">,
  upgradesById: ReturnType<typeof toUpgradesById>
): ReadonlySet<string> {
  const catalogById = new Map(characters.map((unit) => [unit.id, unit]))
  const ownedBase = inventoryBaseUpgrades(
    inventoryUpgrades.map((entry) => ({
      id: entry.upgradeId,
      amount: entry.amount,
    })),
    upgradesById
  )
  const ready = new Set<string>()
  for (const record of playerCharacters) {
    const character = catalogById.get(record.unitId)
    if (
      character &&
      record.rank !== maxRankForProgression(record.progressionIndex) &&
      rankUpReadiness(
        mapCharacterStorageToDomain(character),
        record.rank,
        record.appliedUpgradeSlots,
        ownedBase,
        upgradesById
      )
    ) {
      ready.add(record.unitId)
    }
  }
  return ready
}

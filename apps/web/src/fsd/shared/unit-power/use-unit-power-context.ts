import { useMemo } from "react"
import type {
  CharacterStorageModel,
  EquipmentStorageModel,
  MowStorageModel,
  NpcStorageModel,
  UnitPowerStorageModel,
  UpgradeStorageModel,
} from "@workspace/game-catalog"
import { hasGameCatalogSynced } from "@workspace/game-catalog/queries"

import { combineReadStates, useReadState, type ReadState } from "@/shared/lib"
import { useCatalogDataset } from "@/shared/local-data"

import {
  buildUnitPowerContext,
  type UnitPowerContext,
} from "./unit-power-context"

function firstRecord<T>(records: T[]): T | null {
  return records[0] ?? null
}

/** The power context, rebuilt when one of its datasets changes; `data` is null when the
 *  `unit-power` dataset is absent (not served by a catalog that has synced). Before the catalog's
 *  first sync completes (a fresh device) it stays `loading`, so pages show their placeholder rather
 *  than "unavailable" or power 0. Every dataset comes from the shared read cache, so several
 *  mounted consumers share one read each. */
export function useUnitPowerContext(): ReadState<UnitPowerContext | null> {
  const reads = [
    useCatalogDataset("unit-power", firstRecord),
    useCatalogDataset("characters"),
    useCatalogDataset("mows"),
    useCatalogDataset("npcs"),
    useCatalogDataset("equipment"),
    useCatalogDataset("upgrades"),
    // Only decides anything when `unit-power` is missing; every sync invalidates it.
    useReadState("catalog-synced", hasGameCatalogSynced, []),
  ] as const
  const read = combineReadStates(...reads)
  const [unitPower, characters, mows, npcs, equipment, upgrades, synced] =
    reads.map((state) => (state.status === "ready" ? state.data : undefined))
  const status = read.status

  // Keyed on each dataset (each referentially stable while unchanged), not on the combined tuple.
  const context = useMemo(() => {
    if (status !== "ready") return undefined
    if (!unitPower && !synced) return undefined
    return buildUnitPowerContext({
      unitPower: unitPower as UnitPowerStorageModel | null,
      characters: characters as CharacterStorageModel[],
      mows: mows as MowStorageModel[],
      npcs: npcs as NpcStorageModel[],
      equipment: equipment as EquipmentStorageModel[],
      upgrades: upgrades as UpgradeStorageModel[],
    })
  }, [status, unitPower, characters, mows, npcs, equipment, upgrades, synced])

  const retry = read.retry
  return useMemo((): ReadState<UnitPowerContext | null> => {
    if (status === "error") return { status, retry }
    if (context === undefined) return { status: "loading", retry }
    return { status: "ready", data: context, retry }
    // `retry` is rebuilt per render by combineReadStates; it only matters on error.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, context])
}

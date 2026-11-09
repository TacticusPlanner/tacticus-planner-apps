import { useState } from "react"
import { startingProgression } from "@workspace/game-domain"

import { bulkUnitKey, type BulkGoalUnit } from "@/features/goal-create"
import type { UnitTileUnit } from "@/entities/unit"

/** A Collection unit as the bulk dialog plans it: its current values, or where it would start. */
export function toBulkGoalUnit(unit: UnitTileUnit): BulkGoalUnit {
  const base = { kind: unit.kind, unitId: unit.unitId, name: unit.name }
  if (unit.data.state === "owned") {
    return {
      ...base,
      owned: true,
      progression: unit.data.progression,
      rank: unit.data.rank,
      abilityLevels: unit.data.abilityLevels,
    }
  }
  return {
    ...base,
    owned: false,
    // A Machine of War's catalog has no initial rarity; it starts at Common.
    startProgression: startingProgression(unit.data.rarity ?? "Common"),
  }
}

/**
 * Collection's select mode: whether it is on and the selected units by key, in the order they were
 * picked. The selection outlives the listed units (filters may hide a selected one).
 */
export function useCollectionSelection() {
  const [active, setActive] = useState(false)
  const [selected, setSelected] = useState<ReadonlyMap<string, UnitTileUnit>>(
    () => new Map()
  )

  const end = () => {
    setActive(false)
    setSelected(new Map())
  }

  return {
    active,
    selected,
    start: () => setActive(true),
    end,
    isSelected: (unit: UnitTileUnit) => selected.has(bulkUnitKey(unit)),
    toggle: (unit: UnitTileUnit) =>
      setSelected((previous) => {
        const next = new Map(previous)
        const key = bulkUnitKey(unit)
        if (next.has(key)) next.delete(key)
        else next.set(key, unit)
        return next
      }),
    addAll: (units: readonly UnitTileUnit[]) =>
      setSelected((previous) => {
        const next = new Map(previous)
        for (const unit of units) next.set(bulkUnitKey(unit), unit)
        return next
      }),
    remove: (key: string) =>
      setSelected((previous) => {
        const next = new Map(previous)
        next.delete(key)
        return next
      }),
    clear: () => setSelected(new Map()),
  }
}

export type CollectionSelection = ReturnType<typeof useCollectionSelection>

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { fieldNpcIcon } from "@workspace/game-catalog"
import type { NpcStorageModel } from "@workspace/game-catalog"

import {
  buildAdjustedView,
  buildModifierContext,
  encounterProgressionStepIndex,
  fieldNpcIdsForStep,
  maxKnownProgressionIndex,
  resolveFieldNpcName,
  resolveFieldNpcRosterId,
  type RaidBoss,
  type ResolvedRaidBossEncounterLocation,
} from "@/entities/raid-boss"
import { useCatalogDataset } from "@/shared/local-data"

import type { RaidBossesCatalog } from "./use-raid-bosses-catalog"

const NO_NPCS: NpcStorageModel[] = []

/** The selected entity's detail state: progression step, prime HP-lost points and the modifier,
 *  field-enemy and adjusted-stats views derived from them (and from an exact encounter context). */
export function useRaidBossDetail(
  catalog: RaidBossesCatalog,
  selectedUnit: RaidBoss | undefined,
  exactLocation: ResolvedRaidBossEncounterLocation | undefined
) {
  const npcsRead = useCatalogDataset("npcs")
  const npcs = npcsRead.status === "ready" ? npcsRead.data : NO_NPCS

  // Progression step and per-prime HP-lost points are ephemeral exploration state (not URL-backed) —
  // reset whenever the selected entity changes.
  const [stepIndex, setStepIndex] = useState(0)
  const [hpLostByPrime, setHpLostByPrime] = useState<Record<string, number>>({})
  const stepForUnitRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (!selectedUnit || !catalog.payload) return
    const key = exactLocation
      ? `${selectedUnit.unitSetId}:${exactLocation.seasonId}:${exactLocation.tier}:${exactLocation.set}:${exactLocation.encounterIndex}`
      : selectedUnit.unitSetId
    if (stepForUnitRef.current === key) return

    stepForUnitRef.current = key
    setHpLostByPrime({})
    setStepIndex(
      exactLocation
        ? encounterProgressionStepIndex(
            exactLocation.encounter.progressionIndex,
            selectedUnit.statProgression.length
          )
        : maxKnownProgressionIndex(
            catalog.payload,
            selectedUnit.unitSetId,
            selectedUnit.statProgression.length
          )
    )
  }, [selectedUnit, catalog.payload, exactLocation])

  const onHpLostChange = useCallback(
    (primeUnitSetId: string, hpLost: number) =>
      setHpLostByPrime((prev) => ({ ...prev, [primeUnitSetId]: hpLost })),
    []
  )

  const modifierContext = useMemo(
    () =>
      catalog.payload && selectedUnit
        ? buildModifierContext(
            catalog.payload,
            selectedUnit,
            stepIndex,
            (id) => catalog.nameById.get(id) ?? id,
            exactLocation
          )
        : ({ kind: "none" } as const),
    [catalog.payload, catalog.nameById, selectedUnit, stepIndex, exactLocation]
  )

  const fieldEnemies = useMemo(
    () =>
      catalog.payload && selectedUnit
        ? fieldNpcIdsForStep(
            catalog.payload,
            selectedUnit.unitSetId,
            stepIndex,
            exactLocation
          ).map((id) => ({
            name: resolveFieldNpcName(id, selectedUnit.factionId, npcs),
            iconSrc: fieldNpcIcon({
              id,
              questUnitId: resolveFieldNpcRosterId(
                id,
                selectedUnit.factionId,
                npcs
              ),
            }),
          }))
        : [],
    [catalog.payload, selectedUnit, stepIndex, npcs, exactLocation]
  )

  const adjusted = useMemo(() => {
    if (!catalog.payload || !selectedUnit) return null
    const view = buildAdjustedView(
      catalog.payload,
      selectedUnit,
      stepIndex,
      hpLostByPrime,
      exactLocation
    )
    if (!view) return null
    return {
      view,
      hpLostByPrime,
      onHpLostChange,
      primeLabels: Object.fromEntries(
        view.primes.map((panel) => [
          panel.id,
          catalog.nameById.get(panel.unitSetId) ?? panel.unitSetId,
        ])
      ),
      enemyNames: view.enemies.ids.map((id) =>
        resolveFieldNpcName(id, selectedUnit.factionId, npcs)
      ),
      removed: view.enemies.removed.map((entry) => ({
        name: resolveFieldNpcName(
          entry.unitSetId,
          selectedUnit.factionId,
          npcs
        ),
        count: entry.count,
      })),
    }
  }, [
    catalog.payload,
    catalog.nameById,
    selectedUnit,
    stepIndex,
    hpLostByPrime,
    onHpLostChange,
    npcs,
    exactLocation,
  ])

  return { stepIndex, setStepIndex, modifierContext, fieldEnemies, adjusted }
}

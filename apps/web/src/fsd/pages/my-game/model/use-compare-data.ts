import { useMemo } from "react"
import { useQueries, useQuery } from "@tanstack/react-query"
import type { Progression, Rarity } from "@workspace/game-domain"

import {
  legendaryEventPlanQueries,
  useLegendaryEvents,
  type LegendaryEventPlan,
} from "@/entities/legendary-event"
import {
  formatRosterSourceId,
  parseRosterSourceId,
  rosterSnapshotQueries,
  useRosterSnapshots,
  type DiffRoster,
  type PersonalRosterSnapshotList,
  type RosterDiffContext,
  type RosterSnapshotSource,
} from "@/entities/roster-snapshot"
import { useQueryReadState, type ReadState } from "@/shared/lib"
import { useCatalogDataset, usePlayerChunk } from "@/shared/local-data"
import {
  mowPowerAt,
  rosterCharacterPower,
  useUnitPowerContext,
  type UnitPowerContext,
} from "@/shared/unit-power"

import { COMPARE_CURRENT } from "./compare-query"

/** A roster the pickers offer: a personal snapshot or a Legendary Event run record's roster. */
export type CompareSource =
  | {
      kind: "snapshot"
      id: string
      name: string
      source: RosterSnapshotSource
      takenAt: string
    }
  | {
      kind: "runRecord"
      id: string
      eventId: string
      eventName: string
      run: number
      takenAt: string
    }

export interface CompareSources {
  /** Newest `takenAt` first, both kinds together. */
  sources: CompareSource[]
  personal: PersonalRosterSnapshotList
  plans: LegendaryEventPlan[]
  /** Catalog event names by id (an event no longer in the catalog shows its id). */
  eventNames: ReadonlyMap<string, string>
}

const loading = (retry: () => void): ReadState<never> => ({
  status: "loading",
  retry,
})

/**
 * Every source compare mode can use: the personal snapshots and the newest page of run records of
 * each Legendary Event the user has a plan for. `enabled` false (a guest, or compare mode off for
 * the run records) requests nothing.
 */
export function useCompareSources(enabled: boolean): ReadState<CompareSources> {
  const personal = useQueryReadState(useRosterSnapshots(enabled))
  const plansQuery = useQueryReadState(
    useQuery({ ...legendaryEventPlanQueries.list(), enabled })
  )
  const plans = plansQuery.status === "ready" ? plansQuery.data : undefined
  const records = useQueries({
    queries: (plans ?? []).map((plan) => ({
      ...legendaryEventPlanQueries.latestRunRecords(plan.eventId),
      enabled,
    })),
  })
  const events = useLegendaryEvents()
  const eventNames = useMemo(
    () =>
      new Map(
        (events.status === "ready" ? events.data : []).map((event) => [
          event.id,
          event.name,
        ])
      ),
    [events]
  )

  const recordsError = records.some(
    (query) => query.isError && !query.isFetching
  )
  const recordsReady = records.every((query) => query.data !== undefined)
  const recordPages = records.map((query) => query.data)
  // Stable while no page changed, so the memo below does not rebuild every render.
  const recordsKey = recordPages
    .map((page) => (page ? `${page.eventId}:${page.records.length}` : "-"))
    .join("|")

  const retry = () => {
    personal.retry()
    plansQuery.retry()
    for (const query of records) if (query.isError) void query.refetch()
  }

  const personalData = personal.status === "ready" ? personal.data : undefined
  const sources = useMemo(() => {
    if (!personalData || !plans || !recordsReady) return undefined
    const list: CompareSource[] = [
      ...personalData.items.map((snapshot): CompareSource => ({
        kind: "snapshot",
        id: snapshot.id,
        name: snapshot.name,
        source: snapshot.source,
        takenAt: snapshot.takenAt,
      })),
      ...recordPages.flatMap((page) =>
        (page?.records ?? []).map((record): CompareSource => ({
          kind: "runRecord",
          id: formatRosterSourceId({
            kind: "runRecord",
            eventId: page!.eventId,
            recordId: record.id,
          }),
          eventId: page!.eventId,
          eventName: eventNames.get(page!.eventId) ?? page!.eventId,
          run: record.run,
          takenAt: record.progressAt,
        }))
      ),
    ]
    return list.sort((a, b) => Date.parse(b.takenAt) - Date.parse(a.takenAt))
    // recordPages is summarized by recordsKey.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personalData, plans, recordsReady, recordsKey, eventNames])

  if (!enabled) return loading(retry)
  if (
    personal.status === "error" ||
    plansQuery.status === "error" ||
    recordsError
  ) {
    return { status: "error", retry }
  }
  if (!sources || !personalData || !plans) return loading(retry)
  return {
    status: "ready",
    data: { sources, personal: personalData, plans, eventNames },
    retry,
  }
}

/**
 * One side's roster: the synced roster for `current`, else the stored roster of the snapshot or
 * run record `sourceId` names (read on demand; a snapshot's never changes).
 */
export function useSourceRoster(
  sourceId: string | null,
  enabled: boolean
): ReadState<DiffRoster> {
  const parsed =
    sourceId === null || sourceId === COMPARE_CURRENT
      ? null
      : parseRosterSourceId(sourceId)
  const runRecord = useQueryReadState(
    useQuery({
      ...legendaryEventPlanQueries.runRecordRoster(
        parsed?.kind === "runRecord" ? parsed.eventId : "",
        parsed?.kind === "runRecord" ? parsed.recordId : ""
      ),
      enabled: enabled && parsed?.kind === "runRecord",
    })
  )
  const snapshot = useQueryReadState(
    useQuery({
      ...rosterSnapshotQueries.detail(
        parsed?.kind === "snapshot" ? parsed.snapshotId : ""
      ),
      enabled: enabled && parsed?.kind === "snapshot",
    })
  )
  const stored = parsed?.kind === "runRecord" ? runRecord : snapshot
  const characters = usePlayerChunk("characters")
  const mows = usePlayerChunk("mows")

  return useMemo((): ReadState<DiffRoster> => {
    const retry = () => {
      stored.retry()
      characters.retry()
      mows.retry()
    }
    if (sourceId === COMPARE_CURRENT) {
      if (characters.status === "error" || mows.status === "error") {
        return { status: "error", retry }
      }
      if (characters.status !== "ready" || mows.status !== "ready") {
        return loading(retry)
      }
      return {
        status: "ready",
        data: { characters: characters.data ?? [], mows: mows.data ?? [] },
        retry,
      }
    }
    if (sourceId === null) return loading(retry)
    if (stored.status !== "ready") return { ...stored, retry }
    return { status: "ready", data: stored.data, retry }
  }, [sourceId, stored, characters, mows])
}

type AscensionStep = { shards: number; mythicShards: number }

/** The catalog figures the full diff reads: unlock and step shard costs, and unit power (left out
 *  when the catalog serves no power data). */
export function useRosterDiffContext(): ReadState<RosterDiffContext> {
  const characters = useCatalogDataset("characters", toInitialRarity)
  const unlock = useCatalogDataset("unlock-shard-costs", toUnlockCosts)
  const steps = useCatalogDataset("ascension-costs", toStepCosts)
  const power = useUnitPowerContext()
  const rarities = characters.status === "ready" ? characters.data : undefined
  const unlockCosts = unlock.status === "ready" ? unlock.data : undefined
  const stepCosts = steps.status === "ready" ? steps.data : undefined
  // null: the catalog serves no power data, so the diff leaves power out.
  const powerContext = power.status === "ready" ? power.data : undefined

  const context = useMemo(
    (): RosterDiffContext | undefined =>
      rarities && unlockCosts && stepCosts && powerContext !== undefined
        ? {
            initialRarity: (kind, unitId) =>
              kind === "character" ? rarities.get(unitId) : undefined,
            unlockShards: (rarity) => unlockCosts.get(rarity),
            stepCost: (progression) => stepCosts.get(progression),
            power: powerContext ? unitPower(powerContext) : undefined,
          }
        : undefined,
    [rarities, unlockCosts, stepCosts, powerContext]
  )

  const reads = [characters, unlock, steps, power]
  const retry = () => {
    for (const read of reads) read.retry()
  }
  if (reads.some((read) => read.status === "error")) {
    return { status: "error", retry }
  }
  return context ? { status: "ready", data: context, retry } : loading(retry)
}

function unitPower(context: UnitPowerContext): RosterDiffContext["power"] {
  return (kind, unit) =>
    kind === "character"
      ? unit.rank === undefined
        ? null
        : rosterCharacterPower(
            {
              unitId: unit.unitId,
              rank: unit.rank,
              progressionIndex: unit.progressionIndex,
              abilities: unit.abilities ?? [],
              appliedUpgradeSlots: unit.appliedUpgradeSlots ?? [],
              equippedItems: unit.equippedItems ?? [],
            } as Parameters<typeof rosterCharacterPower>[0],
            context
          )
      : mowPowerAt(
          unit.unitId,
          {
            progression: unit.progressionIndex,
            primaryAbilityLevel: unit.abilities?.[0]?.level ?? 1,
            secondaryAbilityLevel: unit.abilities?.[1]?.level ?? 1,
          },
          context
        )
}

const toInitialRarity = (
  records: readonly { id: string; initialRarity: Rarity }[]
): ReadonlyMap<string, Rarity> =>
  new Map(records.map((record) => [record.id, record.initialRarity]))

const toUnlockCosts = (
  records: readonly { rarity: Rarity; shards: number }[]
): ReadonlyMap<Rarity, number> =>
  new Map(records.map((record) => [record.rarity, record.shards]))

const toStepCosts = (
  records: readonly ({ progression: Progression } & AscensionStep)[]
): ReadonlyMap<Progression, AscensionStep> =>
  new Map(
    records.map((record) => [
      record.progression,
      { shards: record.shards, mythicShards: record.mythicShards },
    ])
  )

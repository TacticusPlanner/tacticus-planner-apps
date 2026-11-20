import { useMemo } from "react"
import type { Progression, Rank } from "@workspace/game-domain"

import { combineReadStates } from "@/shared/lib"
import type { ReadState } from "@/shared/lib"
import { usePlayerChunk } from "@/shared/local-data"

import type { TeamUnitView } from "../ui/team-unit-portrait"

/** An owned unit as a team shows it. */
export interface TeamRosterUnit {
  progression: Progression
  rank?: Rank
  /** Active then passive (characters), primary then secondary (MoWs). */
  abilityLevels: [number, number]
  xpLevel?: number
}

/** The synced roster by unit id; null when it has never synced. */
export interface TeamRoster {
  characters: ReadonlyMap<string, TeamRosterUnit>
  mows: ReadonlyMap<string, TeamRosterUnit>
}

type ChunkUnit = {
  unitId: string
  progressionIndex: Progression
  rank?: Rank
  xpLevel?: number
  abilities?: readonly { level: number }[]
}

function toRosterMap(
  units: readonly ChunkUnit[]
): ReadonlyMap<string, TeamRosterUnit> {
  return new Map(
    units.map((unit) => [
      unit.unitId,
      {
        progression: unit.progressionIndex,
        rank: unit.rank,
        xpLevel: unit.xpLevel,
        abilityLevels: [
          unit.abilities?.[0]?.level ?? 0,
          unit.abilities?.[1]?.level ?? 0,
        ],
      },
    ])
  )
}

/** The player's synced characters and MoWs, or null data when the roster has not synced. */
export function useTeamRoster(): ReadState<TeamRoster | null> {
  const characters = usePlayerChunk("characters")
  const mows = usePlayerChunk("mows")
  const combined = combineReadStates(characters, mows)
  const data = combined.status === "ready" ? combined.data : undefined
  const loaded = data !== undefined
  const [characterChunk, mowChunk] = data ?? []
  const roster = useMemo(() => {
    if (!loaded) return undefined
    if (!characterChunk) return null
    return {
      characters: toRosterMap(characterChunk),
      mows: toRosterMap(mowChunk ?? []),
    }
  }, [loaded, characterChunk, mowChunk])
  if (combined.status !== "ready" || roster === undefined) {
    return combined.status === "error"
      ? { status: "error", retry: combined.retry }
      : { status: "loading", retry: combined.retry }
  }
  return { status: "ready", data: roster, retry: combined.retry }
}

/** A unit's portrait view from the roster (null roster: ownership unknown). */
export function teamUnitView(
  kind: TeamUnitView["kind"],
  unitId: string,
  roster: TeamRoster | null | undefined
): TeamUnitView {
  if (!roster) return { kind, unitId, owned: undefined }
  const entry = (kind === "character" ? roster.characters : roster.mows).get(
    unitId
  )
  return entry
    ? {
        kind,
        unitId,
        owned: true,
        progression: entry.progression,
        rank: entry.rank,
      }
    : { kind, unitId, owned: false }
}

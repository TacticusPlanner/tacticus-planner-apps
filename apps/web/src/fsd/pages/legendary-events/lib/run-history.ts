import {
  progressionIndex,
  rankIndex,
  type Progression,
  type Rank,
} from "@workspace/game-domain"

import {
  LEGENDARY_EVENT_LANE_IDS,
  buildLanePointsModel,
  buildSyncedLaneProgress,
  type LegendaryEvent,
  type LegendaryEventLane,
  type LegendaryEventLaneId,
  type LegendaryEventLaneRecord,
  type LegendaryEventLifecycleState,
  type LegendaryEventProgress,
  type LegendaryEventRosterUnit,
  type LegendaryEventRun,
  type LegendaryEventRunRecord,
  type LegendaryEventRunRecordEncounter,
  type LegendaryEventRunRecordTeam,
  type ReadState,
  type RosterSnapshot,
} from "@/entities/legendary-event"

/** The event's records split into the current run, the previous run and earlier runs (design D6). */
export interface RunRecordSelection {
  current: LegendaryEventRunRecord | null
  previous: LegendaryEventRunRecord | null
  earlier: LegendaryEventRunRecord[]
}

/**
 * Classifies records (newest first): on an active event whose newest record is the synced current
 * run, the newest is current, the next previous and the rest earlier; otherwise there is no current
 * record, the newest is previous and the rest earlier.
 */
export function selectRunRecords(
  records: readonly LegendaryEventRunRecord[],
  lifecycle: LegendaryEventLifecycleState,
  progressEntry: Pick<LegendaryEventProgress, "currentEventRun"> | undefined
): RunRecordSelection {
  const [newest, ...rest] = records
  if (!newest) return { current: null, previous: null, earlier: [] }
  if (
    lifecycle === "active" &&
    progressEntry?.currentEventRun != null &&
    newest.run === progressEntry.currentEventRun
  ) {
    const [previous = null, ...earlier] = rest
    return { current: newest, previous, earlier }
  }
  return { current: null, previous: newest, earlier: rest }
}

const DEFEAT_ALL_ID = 0

/** The highest 1-based battle whose encounter passes `cleared`; 0 when none does. */
function deepestBattle(
  encounters: readonly LegendaryEventRunRecordEncounter[],
  cleared: (ids: ReadonlySet<number>) => boolean
): number {
  let deepest = 0
  for (const [index, encounter] of encounters.entries()) {
    if (cleared(new Set(encounter.objectivesCleared))) deepest = index + 1
  }
  return deepest
}

export interface RecordLaneSummary {
  /** The highest battle with defeat-all cleared; 0 when none. */
  clearedBattle: number
  /** The synced-progress earned points over the current catalog lane, the stored high score
   *  standing for both awards; null when the record has more battles than the catalog lane
   *  (catalog drift). */
  points: number | null
}

/**
 * A record lane's cleared battle and earned points (design D7). A record keeps only each
 * encounter's high score, which the game reports equal to the kill score, so it stands for both
 * awards (`encounterPoints = highScore`).
 */
export function recordLaneSummary(
  encounters: readonly LegendaryEventRunRecordEncounter[] | null,
  lane: Pick<
    LegendaryEventLane,
    "battleIds" | "battlesPoints" | "defeatAll" | "unitsRestrictions"
  >
): RecordLaneSummary {
  const list = encounters ?? []
  const clearedBattle = deepestBattle(list, (ids) => ids.has(DEFEAT_ALL_ID))
  const model = buildLanePointsModel(lane)
  if (list.length > model.battles.length) return { clearedBattle, points: null }
  const progress = buildSyncedLaneProgress(model, {
    encounters: list.map((encounter) => ({
      ...encounter,
      encounterPoints: encounter.highScore,
    })),
  } as unknown as LegendaryEventLaneRecord)
  return { clearedBattle, points: progress.pointsEarned }
}

/**
 * The deepest battle where defeat-all and every objective the team covered (ids `index + 1`) were
 * cleared; a team without objectives uses the lane's cleared battle. Inferred from shared lane
 * progress: the game does not report which team cleared what.
 */
export function recordTeamClearedBattle(
  team: Pick<LegendaryEventRunRecordTeam, "objectiveIndexes">,
  encounters: readonly LegendaryEventRunRecordEncounter[] | null
): number {
  const required = [
    DEFEAT_ALL_ID,
    ...team.objectiveIndexes.map((index) => index + 1),
  ]
  return deepestBattle(encounters ?? [], (ids) =>
    required.every((id) => ids.has(id))
  )
}

interface FromTo<T> {
  from: T
  to: T
}

/** What changed on one unit since the record's roster snapshot. */
export interface RosterDelta {
  unitId: string
  /** Absent then, owned now; the other changes are then empty. */
  unlocked: boolean
  progression: FromTo<Progression> | null
  rank: FromTo<Rank> | null
  /** Each ability whose level rose; `slot` 0 is the active ability, 1 the passive. */
  abilities: (FromTo<number> & { slot: number; abilityId: string })[]
}

type SnapshotUnit = Pick<
  RosterSnapshot["characters"][number],
  "unitId" | "progressionIndex" | "abilities"
> & { rank?: Rank }

/**
 * Roster changes for `unitIds` between the snapshot and the current roster (design D7): unlocked,
 * a later progression, a later rank (applied upgrades ignored) and each ability that rose. Units
 * unchanged, not owned now, or owned neither then nor now are omitted; values that went down are
 * ignored.
 */
export function rosterDeltas(
  snapshot: Pick<RosterSnapshot, "characters" | "mows">,
  roster: readonly LegendaryEventRosterUnit[],
  unitIds: readonly string[]
): RosterDelta[] {
  const then = new Map<string, SnapshotUnit>(
    [...snapshot.characters, ...snapshot.mows].map((unit) => [
      unit.unitId,
      unit,
    ])
  )
  const now = new Map(roster.map((unit) => [unit.unitId as string, unit]))
  return [...new Set(unitIds)].flatMap((unitId): RosterDelta[] => {
    const current = now.get(unitId)
    if (!current) return []
    const before = then.get(unitId)
    if (!before) {
      return [
        {
          unitId,
          unlocked: true,
          progression: null,
          rank: null,
          abilities: [],
        },
      ]
    }
    const progression =
      progressionIndex(current.progressionIndex) >
      progressionIndex(before.progressionIndex)
        ? { from: before.progressionIndex, to: current.progressionIndex }
        : null
    const rank =
      before.rank !== undefined &&
      rankIndex(current.rank) > rankIndex(before.rank)
        ? { from: before.rank, to: current.rank }
        : null
    const abilities = (current.abilities ?? []).flatMap((ability, slot) => {
      const previous =
        before.abilities.find(
          (entry) => entry.abilityId === ability.abilityId
        ) ?? before.abilities[slot]
      return previous && ability.level > previous.level
        ? [
            {
              slot,
              abilityId: ability.abilityId,
              from: previous.level,
              to: ability.level,
            },
          ]
        : []
    })
    if (!progression && !rank && abilities.length === 0) return []
    return [{ unitId, unlocked: false, progression, rank, abilities }]
  })
}

export interface RunHistoryTeam {
  team: LegendaryEventRunRecordTeam
  /** "Cleared up to battle N" (inferred). */
  clearedBattle: number
  /** The team's planned depth for that run, when stored. */
  plannedDepth: number | null
}

export interface RunHistoryLane extends RecordLaneSummary {
  laneId: LegendaryEventLaneId
  teams: RunHistoryTeam[]
}

/** Why a record has no roster changes list (yet), or the list itself. The record's roster is read on
 *  demand, so it can still be loading or have failed (with a retry). */
type RunHistoryDeltas =
  | { kind: "noTeams" }
  | { kind: "snapshotLoading" }
  | { kind: "snapshotFailed"; retry: () => void }
  | { kind: "noRoster" }
  | { kind: "ready"; deltas: RosterDelta[] }

/** Everything the Last run card (and an Earlier runs entry) renders for one record. */
export interface RunHistory {
  recordId: string
  run: LegendaryEventRun
  /** ISO 8601 UTC of the record's last progress. */
  progressAt: string
  points: number
  lanes: RunHistoryLane[]
  teamCount: number
  deltas: RunHistoryDeltas
}

/**
 * The one structure the history UI renders for a record (design D7): per lane its cleared battle,
 * points and teams with their cleared battle, and the roster changes of the teams' members and
 * reserves. `roster` (the current one) is undefined when it could not be read; `snapshot` is the
 * record's own roster as read on demand (undefined while not requested, which reads as loading).
 */
export function recordHistory(
  record: LegendaryEventRunRecord,
  event: Pick<LegendaryEvent, LegendaryEventLaneId>,
  roster: readonly LegendaryEventRosterUnit[] | undefined,
  snapshot: ReadState<RosterSnapshot> | undefined
): RunHistory {
  const lanes = LEGENDARY_EVENT_LANE_IDS.map((laneId): RunHistoryLane => {
    const encounters = record.lanes[laneId]
    return {
      laneId,
      ...recordLaneSummary(encounters, event[laneId]),
      teams: record.teams
        .filter((team) => team.laneId === laneId)
        .map((team) => ({
          team,
          clearedBattle: recordTeamClearedBattle(team, encounters),
          plannedDepth: team.expectedBattleClears,
        })),
    }
  })
  const unitIds = record.teams.flatMap((team) => [
    ...team.memberUnitIds,
    ...(team.reserveUnitId ? [team.reserveUnitId] : []),
  ])
  const deltas: RunHistoryDeltas =
    record.teams.length === 0
      ? { kind: "noTeams" }
      : !snapshot || snapshot.status === "loading"
        ? { kind: "snapshotLoading" }
        : snapshot.status === "error"
          ? { kind: "snapshotFailed", retry: snapshot.retry }
          : !roster
            ? { kind: "noRoster" }
            : {
                kind: "ready",
                deltas: rosterDeltas(snapshot.data, roster, unitIds),
              }
  return {
    recordId: record.id,
    run: record.run,
    progressAt: record.progressAt,
    points: record.points,
    lanes,
    teamCount: record.teams.length,
    deltas,
  }
}

/** Each previous-run team's cleared battle by team id and lane (the team card's last-run line). */
export function previousRunTeamClears(
  record: LegendaryEventRunRecord | null
): ReadonlyMap<
  string,
  { laneId: LegendaryEventLaneId; clearedBattle: number }
> {
  if (!record) return new Map()
  return new Map(
    record.teams.map((team) => [
      team.teamId,
      {
        laneId: team.laneId,
        clearedBattle: recordTeamClearedBattle(team, record.lanes[team.laneId]),
      },
    ])
  )
}

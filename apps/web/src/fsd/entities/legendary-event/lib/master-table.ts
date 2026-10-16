import type { Progression, Rank } from "@workspace/game-domain"

import type {
  LegendaryEventPlan,
  LegendaryEventTeam,
} from "../model/plan.types"
import {
  LEGENDARY_EVENT_LANE_IDS,
  type LegendaryEvent,
  type LegendaryEventLane,
  type LegendaryEventLaneId,
  type LegendaryEventProgress,
  type LegendaryEventRosterUnit,
  type LegendaryEventUnit,
} from "../model/types"
import {
  teamClearEstimate,
  teamEffectiveDepth,
  unitClearEstimate,
  type ClearEstimateConfig,
  type ClearEstimateRoster,
} from "./clear-estimate"
import { currentLegendaryEventRun, teamDepthForRun } from "./current-run"
import { buildLanePointsModel } from "./lane-points-model"
import { isUnitAllowedOnLane } from "./objective-match"
import {
  buildSyncedLaneProgress,
  type LaneProgressView,
} from "./synced-lane-progress"
import { derivedTeamCoverage } from "./team-coverage"
import {
  remainingLanePoints,
  unitLanePotential,
  type LaneUnitPotential,
} from "./unit-potential"

/** Which units the master table lists (design D3): every allowed unit, the owned ones, or the
 *  ones a selected event's plan holds in a team. */
export type MasterTableUnitSet = "all" | "unlocked" | "inTeams"

/** What a cell counts (design D3): every battle, the battles' uncleared points, or the uncleared
 *  points within the battles the unit is expected to clear. */
export type MasterTablePointsMode = "remaining" | "all" | "estimated"

/** One selected event with what its cells read. */
export interface MasterTableEventInput {
  event: Pick<LegendaryEvent, "id" | LegendaryEventLaneId>
  /** The stored plan; undefined when there is none or the list is unavailable (no teams). */
  plan?: Pick<LegendaryEventPlan, "teams">
  /** The synced entry; undefined when there is none or progress failed (nothing is cleared). */
  progress?: LegendaryEventProgress
  /** Each lane's battle powers (Estimated); a lane without them estimates nothing. */
  battlePowers?: Partial<Record<LegendaryEventLaneId, readonly number[] | null>>
}

export interface MasterTableInput {
  /** The selected events, in the order their column groups show. */
  events: readonly MasterTableEventInput[]
  units: readonly LegendaryEventUnit[]
  /** Undefined when the roster could not be read (ownership unknown, nothing estimated). */
  roster: readonly LegendaryEventRosterUnit[] | undefined
  /** Required for Estimated; without it every Estimated cell is 0. */
  config?: ClearEstimateConfig
  unitSet: MasterTableUnitSet
  pointsMode: MasterTablePointsMode
}

export interface MasterTableLaneCell {
  points: number
  /** The battle depth Estimated counted to; null outside Estimated or when there is none. */
  depth: number | null
}

export interface MasterTableCell {
  points: number
  /** Σ over the event's lanes of the objectives the unit satisfies (V1 slots). */
  objectivesCount: number
  /** Distinct teams of the event's plan holding the unit as member or reserve. */
  teamCount: number
  /** Those teams' lanes, in lane order. */
  laneIds: LegendaryEventLaneId[]
  /** Lanes that allow the unit. */
  lanes: Partial<Record<LegendaryEventLaneId, MasterTableLaneCell>>
}

export interface MasterTableRow {
  unitId: string
  unit: LegendaryEventUnit
  /** Undefined when the roster could not be read. */
  owned: boolean | undefined
  progression?: Progression
  rank?: Rank
  /** Σ of the cells. */
  total: number
  /** By event id; an event whose lanes do not allow the unit has an all-zero cell. */
  cells: Record<string, MasterTableCell>
}

export interface MasterTable {
  eventIds: string[]
  rows: MasterTableRow[]
}

type CellLane = Pick<
  LegendaryEventLane,
  | "killPoints"
  | "allowedUnitsFilter"
  | "unitsRestrictions"
  | "battleIds"
  | "battlesPoints"
  | "defeatAll"
>

const EMPTY_CELL: MasterTableCell = {
  points: 0,
  objectivesCount: 0,
  teamCount: 0,
  laneIds: [],
  lanes: {},
}

/** The potential as the considered objectives see it: kill points plus their scores. */
function consideredPotential(
  lane: CellLane,
  considered: readonly number[]
): LaneUnitPotential {
  const scores = lane.unitsRestrictions
    .filter((objective) => considered.includes(objective.index))
    .reduce((sum, objective) => sum + objective.points, 0)
  return {
    pointsPerBattle: lane.killPoints + scores,
    objectivesCount: considered.length,
    satisfied: [...considered],
  }
}

/** Remaining points within battles 1..depth (the Stage 1 rule over a prefix of the lane). */
function remainingWithin(
  potential: LaneUnitPotential,
  progress: LaneProgressView | undefined,
  lane: CellLane,
  depth: number
): number {
  const prefix = Math.max(0, Math.min(depth, lane.battleIds.length))
  return remainingLanePoints(
    potential,
    progress
      ? { ...progress, battles: progress.battles.slice(0, prefix) }
      : undefined,
    { ...lane, battleIds: lane.battleIds.slice(0, prefix) }
  )
}

/** The unit's memberships on a lane: the teams holding it, and the subset where it is a member. */
function laneMemberships(
  teams: readonly LegendaryEventTeam[],
  laneId: LegendaryEventLaneId,
  unitId: string
) {
  const holding = teams.filter(
    (team) =>
      team.laneId === laneId &&
      (team.memberUnitIds.includes(unitId) || team.reserveUnitId === unitId)
  )
  return {
    holding,
    asMember: holding.filter((team) => team.memberUnitIds.includes(unitId)),
  }
}

interface CellContext {
  input: MasterTableInput
  entry: MasterTableEventInput
  progressByLane: Partial<Record<LegendaryEventLaneId, LaneProgressView>>
  rosterById: ClearEstimateRoster | undefined
}

function laneCell(
  context: CellContext,
  unit: LegendaryEventUnit,
  laneId: LegendaryEventLaneId
): MasterTableLaneCell | undefined {
  const { input, entry, progressByLane } = context
  const lane = entry.event[laneId]
  if (!isUnitAllowedOnLane(unit, lane)) return undefined
  const potential = unitLanePotential(unit, lane)
  const teams = entry.plan?.teams ?? []
  const inTeams = input.unitSet === "inTeams"
  const { holding, asMember } = laneMemberships(teams, laneId, unit.id)
  if (inTeams && holding.length === 0) return { points: 0, depth: null }

  // In teams: the union of each membership's stored ∩ derived coverage (reserve-only: none).
  const considered = inTeams
    ? [
        ...new Set(
          asMember.flatMap((team) => {
            const derived = new Set(
              derivedTeamCoverage(team.memberUnitIds, lane, input.units)
            )
            return team.objectiveIndexes.filter((index) => derived.has(index))
          })
        ),
      ].filter((index) => potential.satisfied.includes(index))
    : potential.satisfied
  const counted = consideredPotential(lane, considered)
  const progress = progressByLane[laneId]

  if (input.pointsMode === "all") {
    return {
      points: counted.pointsPerBattle * lane.battleIds.length,
      depth: null,
    }
  }
  if (input.pointsMode === "remaining") {
    return {
      points: remainingLanePoints(counted, progress, lane),
      depth: null,
    }
  }

  const depth = estimatedDepth(context, unit.id, laneId, holding)
  return {
    points:
      depth === null ? 0 : remainingWithin(counted, progress, lane, depth),
    depth,
  }
}

/** Estimated's depth (design D3): in In teams the deepest effective depth among the unit's teams on
 *  the lane (the current run's stored depth, else the team estimate), else the unit's estimate. */
function estimatedDepth(
  { input, entry, rosterById }: CellContext,
  unitId: string,
  laneId: LegendaryEventLaneId,
  holding: readonly LegendaryEventTeam[]
): number | null {
  const powers = entry.battlePowers?.[laneId] ?? null
  const config = input.config
  if (input.unitSet === "inTeams") {
    const run = currentLegendaryEventRun(entry.progress)
    const depths = holding.flatMap((team) => {
      const estimate =
        powers && rosterById && config
          ? teamClearEstimate(team.memberUnitIds, powers, rosterById, config)
          : null
      const depth = teamEffectiveDepth(
        teamDepthForRun(team, run)?.expectedBattleClears ?? null,
        estimate
      )
      return depth === null ? [] : [depth]
    })
    return depths.length > 0 ? Math.max(...depths) : null
  }
  if (!powers || !rosterById || !config) return null
  return unitClearEstimate(unitId, powers, rosterById, config)?.depth ?? null
}

function eventCell(
  context: CellContext,
  unit: LegendaryEventUnit
): MasterTableCell | undefined {
  const { entry } = context
  const lanes: MasterTableCell["lanes"] = {}
  let points = 0
  let objectivesCount = 0
  let allowed = false
  for (const laneId of LEGENDARY_EVENT_LANE_IDS) {
    const cell = laneCell(context, unit, laneId)
    if (!cell) continue
    allowed = true
    lanes[laneId] = cell
    points += cell.points
    objectivesCount += unitLanePotential(
      unit,
      entry.event[laneId]
    ).objectivesCount
  }
  if (!allowed) return undefined
  const teams = (entry.plan?.teams ?? []).filter(
    (team) =>
      team.memberUnitIds.includes(unit.id) || team.reserveUnitId === unit.id
  )
  return {
    points,
    objectivesCount,
    teamCount: teams.length,
    laneIds: LEGENDARY_EVENT_LANE_IDS.filter((laneId) =>
      teams.some((team) => team.laneId === laneId)
    ),
    lanes,
  }
}

/**
 * The master table (design D3): one row per unit at least one lane of a selected event allows,
 * filtered by the unit set, with a cell per selected event and the total of the cells. Rows come
 * in the default order (total descending, then unit id); `sortMasterTable` applies the user's.
 */
export function buildMasterTable(input: MasterTableInput): MasterTable {
  const rosterById = input.roster
    ? new Map(input.roster.map((entry) => [entry.unitId as string, entry]))
    : undefined
  const contexts = input.events.map((entry): CellContext => ({
    input,
    entry,
    rosterById,
    progressByLane: entry.progress
      ? Object.fromEntries(
          LEGENDARY_EVENT_LANE_IDS.map((laneId) => [
            laneId,
            buildSyncedLaneProgress(
              buildLanePointsModel(entry.event[laneId]),
              entry.progress?.[laneId]
            ),
          ])
        )
      : {},
  }))

  const rows = input.units.flatMap((unit): MasterTableRow[] => {
    const cells: Record<string, MasterTableCell> = {}
    let allowed = false
    for (const context of contexts) {
      const cell = eventCell(context, unit)
      if (cell) allowed = true
      cells[context.entry.event.id] = cell ?? EMPTY_CELL
    }
    if (!allowed) return []
    const rosterEntry = rosterById?.get(unit.id)
    if (input.unitSet === "unlocked" && !rosterEntry) return []
    if (
      input.unitSet === "inTeams" &&
      Object.values(cells).every((cell) => cell.teamCount === 0)
    ) {
      return []
    }
    return [
      {
        unitId: unit.id,
        unit,
        owned: rosterById ? rosterEntry !== undefined : undefined,
        progression: rosterEntry?.progressionIndex,
        rank: rosterEntry?.rank,
        total: Object.values(cells).reduce((sum, cell) => sum + cell.points, 0),
        cells,
      },
    ]
  })
  return {
    eventIds: input.events.map((entry) => entry.event.id),
    rows: rows.sort(
      (a, b) => b.total - a.total || a.unitId.localeCompare(b.unitId)
    ),
  }
}

/** Keeps rows whose localized name contains `query`, case-insensitively (blank keeps all). */
export function filterMasterTableRows(
  rows: readonly MasterTableRow[],
  query: string,
  nameOf: (unitId: string) => string,
  locale?: string
): MasterTableRow[] {
  const needle = query.trim().toLocaleLowerCase(locale)
  if (!needle) return [...rows]
  return rows.filter((row) =>
    nameOf(row.unitId).toLocaleLowerCase(locale).includes(needle)
  )
}

/** Orders rows by the sort key descending (one event's points, or the total when `sortEventId` is
 *  null), then the total, then the localized name (design D3). */
export function sortMasterTable(
  rows: readonly MasterTableRow[],
  sortEventId: string | null,
  nameOf: (unitId: string) => string,
  locale?: string
): MasterTableRow[] {
  const key = (row: MasterTableRow) =>
    sortEventId === null ? row.total : (row.cells[sortEventId]?.points ?? 0)
  return [...rows].sort(
    (a, b) =>
      key(b) - key(a) ||
      b.total - a.total ||
      nameOf(a.unitId).localeCompare(nameOf(b.unitId), locale)
  )
}

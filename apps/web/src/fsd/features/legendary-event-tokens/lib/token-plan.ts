import type {
  LanePointsModel,
  LegendaryEventAnnotation,
  LegendaryEventLaneId,
  LegendaryEventLaneRecord,
} from "@/entities/legendary-event"

// Ported from V1 `TokenEstimationService` (`computeNextToken`, `computeAllTokenUsage`,
// `computeNextBestTokenInTrack`, incremental restrictions and points) onto V2's lane cells (design
// D2). Deliberate deviations from V1 are listed in design D3 and pinned by tests.

/** One team as the planner sees it: its lane order, covered objectives and current-run depth. */
export interface TokenPlanTeam {
  id: string
  name: string
  /** Covered lane objective `index`es (cell id `index + 1`). The reserve never counts. */
  objectiveIndexes: readonly number[]
  /** Battles the team reaches this run (manual depth, else the estimate); null plans nothing. */
  depth: number | null
}

export interface TokenPlanLane {
  laneId: LegendaryEventLaneId
  model: LanePointsModel
  /** `null` for a null lane, `undefined` without a synced entry: both start with nothing cleared. */
  synced: LegendaryEventLaneRecord | null | undefined
  /** In lane order (`sortOrder`). */
  teams: readonly TokenPlanTeam[]
  /** The marks in effect on this lane (`applicableAnnotations`). */
  annotations: readonly LegendaryEventAnnotation[]
}

export interface TokenPlanInput {
  /** Alpha, Beta, Gamma order: the order breaks the last tie. */
  lanes: readonly TokenPlanLane[]
  /** Synced `currentPoints` (0 without an entry). */
  startingPoints: number
}

export interface PlannedToken {
  laneId: LegendaryEventLaneId
  /** 0-based battle index. */
  battleIndex: number
  teamId: string
  teamName: string
  /** Cell ids this token clears: 0 defeat-all, `index + 1` an objective; ascending. */
  clearedIds: number[]
  points: number
  /** Synced points plus every planned token up to and including this one. */
  runningPoints: number
  /** A cell it clears is marked Maybe clear. */
  maybe: boolean
  /** Its battle is playable from synced progress alone (first battle, or the previous battle's
   *  defeat-all already cleared in sync). */
  playableNow: boolean
}

export interface TokenPlanLaneResult {
  laneId: LegendaryEventLaneId
  /** Lane maximum minus earned points once every planned token is played. */
  pointsLeftAfterPlan: number
  /** Every battle of the lane is complete in sync. */
  completeInSync: boolean
}

export interface TokenPlan {
  tokens: PlannedToken[]
  totalPoints: number
  lanes: TokenPlanLaneResult[]
}

interface LaneState {
  lane: TokenPlanLane
  cleared: boolean[][]
  highScore: number[]
  stopHere: Set<string>
  maybeClear: Set<string>
}

interface Candidate {
  laneId: LegendaryEventLaneId
  laneOrder: number
  battleIndex: number
  team: TokenPlanTeam
  clearedIds: number[]
  points: number
}

const cellKey = (battleIndex: number, id: number) => `${battleIndex}:${id}`

function initialLaneState(lane: TokenPlanLane): LaneState {
  const columns = lane.model.objectives.length + 1
  const encounters = lane.synced?.encounters ?? []
  const stopHere = new Set<string>()
  const maybeClear = new Set<string>()
  for (const annotation of lane.annotations) {
    const key = cellKey(annotation.battleIndex, annotation.objectiveId)
    if (annotation.status === "stopHere") stopHere.add(key)
    else maybeClear.add(key)
  }
  return {
    lane,
    cleared: lane.model.battles.map((battle) => {
      const ids = new Set(encounters[battle.index]?.objectivesCleared ?? [])
      return Array.from({ length: columns }, (_, id) => ids.has(id))
    }),
    highScore: lane.model.battles.map(
      (battle) => encounters[battle.index]?.highScore ?? 0
    ),
    stopHere,
    maybeClear,
  }
}

const isComplete = (cells: readonly boolean[]) => cells.every(Boolean)

const isAvailable = (state: LaneState, battleIndex: number) =>
  battleIndex === 0 || state.cleared[battleIndex - 1]?.[0] === true

/** The value of one team's token on one battle (spec: token value), or null when it earns nothing. */
function tokenOn(
  state: LaneState,
  battleIndex: number,
  team: TokenPlanTeam
): Pick<Candidate, "clearedIds" | "points"> | null {
  if ((team.depth ?? 0) <= battleIndex) return null
  const cells = state.cleared[battleIndex]
  const battle = state.lane.model.battles[battleIndex]
  if (!cells || !battle) return null
  const covered = new Set(team.objectiveIndexes.map((index) => index + 1))
  const clearedIds = cells.flatMap((isCleared, id) =>
    !isCleared &&
    !state.stopHere.has(cellKey(battleIndex, id)) &&
    (id === 0 || covered.has(id))
      ? [id]
      : []
  )
  const won = cells[0] === true || clearedIds.includes(0)
  // Objectives only count on a won battle; a Stop here defeat-all is never played.
  if (!won) return null
  const points =
    Math.max(0, battle.battlePoints - (state.highScore[battleIndex] ?? 0)) +
    clearedIds.reduce(
      (sum, id) =>
        sum +
        (id === 0
          ? battle.defeatAllPoints
          : (battle.objectiveScores[id - 1] ?? 0)),
      0
    )
  return points > 0 ? { clearedIds, points } : null
}

/** The lane's best token: highest value over its available battles, earlier battle then earlier
 *  team on a tie (V1 `computeNextBestTokenInTrack`). */
function bestInLane(state: LaneState, laneOrder: number): Candidate | null {
  let best: Candidate | null = null
  for (const [battleIndex, cells] of state.cleared.entries()) {
    if (isComplete(cells) || !isAvailable(state, battleIndex)) continue
    if (!cells[0] && state.stopHere.has(cellKey(battleIndex, 0))) continue
    for (const team of state.lane.teams) {
      const token = tokenOn(state, battleIndex, team)
      if (token && (!best || token.points > best.points)) {
        best = {
          laneId: state.lane.laneId,
          laneOrder,
          battleIndex,
          team,
          ...token,
        }
      }
    }
  }
  return best
}

const continues = (
  candidate: Pick<Candidate, "laneId" | "battleIndex"> & { teamId: string },
  previous: PlannedToken | undefined
) =>
  previous !== undefined &&
  candidate.laneId === previous.laneId &&
  candidate.teamId === previous.teamId &&
  candidate.battleIndex === previous.battleIndex + 1

/** The next token across lanes (V1 `computeNextToken`): most points, then the previous token's
 *  team on its next battle, then the earlier lane. */
function chooseAcrossLanes(
  candidates: readonly Candidate[],
  previous: PlannedToken | undefined
): Candidate | null {
  let best: Candidate | null = null
  for (const current of candidates) {
    if (!best || current.points > best.points) {
      best = current
      continue
    }
    if (current.points < best.points) continue
    const currentContinues = continues(
      { ...current, teamId: current.team.id },
      previous
    )
    const bestContinues = continues({ ...best, teamId: best.team.id }, previous)
    if (currentContinues && !bestContinues) best = current
    // Otherwise the earlier lane (iteration order) stays best.
  }
  return best
}

function earnedPoints(state: LaneState): number {
  return state.lane.model.battles.reduce((sum, battle) => {
    const cells = state.cleared[battle.index] ?? []
    const cellPoints = cells.reduce(
      (total, isCleared, id) =>
        isCleared
          ? total +
            (id === 0
              ? battle.defeatAllPoints
              : (battle.objectiveScores[id - 1] ?? 0))
          : total,
      0
    )
    return sum + (state.highScore[battle.index] ?? 0) + cellPoints
  }, 0)
}

/**
 * Orders every token the event still rewards (spec: token plan from synced progress, teams, depths
 * and marks). Pure; recomputed by the caller whenever an input changes, never persisted.
 */
export function planTokens({
  lanes,
  startingPoints,
}: TokenPlanInput): TokenPlan {
  const states = lanes.map(initialLaneState)
  const syncedAvailable = states.map((state) =>
    state.cleared.map((_, battleIndex) => isAvailable(state, battleIndex))
  )
  const completeInSync = states.map((state) => state.cleared.every(isComplete))
  const tokens: PlannedToken[] = []
  let runningPoints = startingPoints

  for (;;) {
    const candidates = states.flatMap((state, laneOrder) => {
      const best = bestInLane(state, laneOrder)
      return best ? [best] : []
    })
    const chosen = chooseAcrossLanes(candidates, tokens.at(-1))
    if (!chosen) break
    const state = states[chosen.laneOrder]!
    for (const id of chosen.clearedIds) {
      state.cleared[chosen.battleIndex]![id] = true
    }
    const battle = state.lane.model.battles[chosen.battleIndex]!
    state.highScore[chosen.battleIndex] = Math.max(
      state.highScore[chosen.battleIndex] ?? 0,
      battle.battlePoints
    )
    runningPoints += chosen.points
    tokens.push({
      laneId: chosen.laneId,
      battleIndex: chosen.battleIndex,
      teamId: chosen.team.id,
      teamName: chosen.team.name,
      clearedIds: chosen.clearedIds,
      points: chosen.points,
      runningPoints,
      maybe: chosen.clearedIds.some((id) =>
        state.maybeClear.has(cellKey(chosen.battleIndex, id))
      ),
      playableNow:
        syncedAvailable[chosen.laneOrder]?.[chosen.battleIndex] === true,
    })
  }

  return {
    tokens,
    totalPoints: runningPoints - startingPoints,
    lanes: states.map((state, laneOrder) => ({
      laneId: state.lane.laneId,
      pointsLeftAfterPlan: Math.max(
        0,
        state.lane.model.maxPoints - earnedPoints(state)
      ),
      completeInSync: completeInSync[laneOrder] ?? false,
    })),
  }
}

export type NextTokenReason = "mostPoints" | "mostPointsPlayableNow"

export interface NextTokenChoice {
  token: PlannedToken
  /** Its position in the plan (0-based). */
  index: number
  reason: NextTokenReason
  /** It continues the previous planned token's team on the next battle of the same lane. */
  sameTeam: boolean
}

/**
 * The token the Next token card shows (design D4): the first planned token that is not flagged
 * Maybe and is playable now, else the plan's first token; null for an empty plan.
 */
export function nextToken(
  plan: Pick<TokenPlan, "tokens">
): NextTokenChoice | null {
  const { tokens } = plan
  if (tokens.length === 0) return null
  const found = tokens.findIndex((token) => !token.maybe && token.playableNow)
  const index = found === -1 ? 0 : found
  const token = tokens[index]!
  return {
    token,
    index,
    // The plan's first token is the best one available now; a later one was picked because the
    // tokens before it are flagged or not playable yet.
    reason: index === 0 ? "mostPoints" : "mostPointsPlayableNow",
    sameTeam: index > 0 && continues(token, tokens[index - 1]),
  }
}

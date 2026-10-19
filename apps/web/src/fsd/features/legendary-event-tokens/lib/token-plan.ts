import {
  buildSyncedLaneProgress,
  type LanePointsModel,
  type LegendaryEventAnnotation,
  type LegendaryEventLaneId,
  type LegendaryEventLaneRecord,
  type LegendaryEventRun,
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
  /** Per-run depths (the 1-click plan's projected rosters); a token spent in a listed run reads
   *  that run's depth instead of `depth` (see `runSlots`). */
  depthByRun?: Partial<Record<LegendaryEventRun, number | null>>
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
  /** The token slots each run supplies, in order (the 1-click plan): with them each token is
   *  valued at its run's `depthByRun`, and a run with nothing left to play leaves its remaining
   *  slots unused, so later runs' deeper teams still get their tokens. */
  runSlots?: readonly RunSlots[]
}

/** Slots `start`..`end − 1` are spent in `run`. */
export interface RunSlots {
  run: LegendaryEventRun
  start: number
  end: number
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
  /** The supply slot it is spent in, with `runSlots` only (slots a run left unused are skipped). */
  slot?: number
}

interface TokenPlanLaneResult {
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
  /** Per battle, the kill score award earned so far (at most `battlePoints`). */
  killScore: number[]
  /** Per battle, the high score award earned so far (at most `battlePoints`). */
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
  // The same per-battle reading as the progress grid: cleared cells, kill score and high score.
  const progress = buildSyncedLaneProgress(lane.model, lane.synced)
  const stopHere = new Set<string>()
  const maybeClear = new Set<string>()
  for (const annotation of lane.annotations) {
    const key = cellKey(annotation.battleIndex, annotation.objectiveId)
    if (annotation.status === "stopHere") stopHere.add(key)
    else maybeClear.add(key)
  }
  return {
    lane,
    cleared: progress.battles.map((battle) => [...battle.cleared]),
    killScore: progress.battles.map((battle) => battle.killScore),
    highScore: progress.battles.map((battle) => battle.highScore),
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
  team: TokenPlanTeam,
  run: LegendaryEventRun | null
): Pick<Candidate, "clearedIds" | "points"> | null {
  const depth =
    run !== null && team.depthByRun && run in team.depthByRun
      ? team.depthByRun[run]
      : team.depth
  if ((depth ?? 0) <= battleIndex) return null
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
  // A won battle awards its full kill score and its full high score.
  const points =
    Math.max(0, battle.battlePoints - (state.killScore[battleIndex] ?? 0)) +
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
function bestInLane(
  state: LaneState,
  laneOrder: number,
  run: LegendaryEventRun | null
): Candidate | null {
  let best: Candidate | null = null
  for (const [battleIndex, cells] of state.cleared.entries()) {
    if (isComplete(cells) || !isAvailable(state, battleIndex)) continue
    if (!cells[0] && state.stopHere.has(cellKey(battleIndex, 0))) continue
    for (const team of state.lane.teams) {
      const token = tokenOn(state, battleIndex, team, run)
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
    return (
      sum +
      (state.killScore[battle.index] ?? 0) +
      (state.highScore[battle.index] ?? 0) +
      cellPoints
    )
  }, 0)
}

/**
 * Orders every token the event still rewards (spec: token plan from synced progress, teams, depths
 * and marks). Pure; recomputed by the caller whenever an input changes, never persisted.
 */
export function planTokens({
  lanes,
  startingPoints,
  runSlots,
}: TokenPlanInput): TokenPlan {
  const states = lanes.map(initialLaneState)
  const syncedAvailable = states.map((state) =>
    state.cleared.map((_, battleIndex) => isAvailable(state, battleIndex))
  )
  const completeInSync = states.map((state) => state.cleared.every(isComplete))
  const tokens: PlannedToken[] = []
  let runningPoints = startingPoints
  let slot = 0

  for (;;) {
    const runSlot = runSlots?.find((entry) => slot < entry.end)
    const run = runSlot?.run ?? null
    const candidates = states.flatMap((state, laneOrder) => {
      const best = bestInLane(state, laneOrder, run)
      return best ? [best] : []
    })
    const chosen = chooseAcrossLanes(candidates, tokens.at(-1))
    if (!chosen) {
      // Nothing left at this run's depths: the next run may reach further.
      if (!runSlot) break
      slot = runSlot.end
      continue
    }
    const state = states[chosen.laneOrder]!
    for (const id of chosen.clearedIds) {
      state.cleared[chosen.battleIndex]![id] = true
    }
    const battle = state.lane.model.battles[chosen.battleIndex]!
    state.killScore[chosen.battleIndex] = battle.battlePoints
    state.highScore[chosen.battleIndex] = battle.battlePoints
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
      ...(runSlots ? { slot } : {}),
    })
    slot += 1
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

type NextTokenReason = "mostPoints" | "mostPointsPlayableNow"

export interface NextTokenChoice {
  token: PlannedToken
  /** Its position in the plan (0-based). */
  index: number
  reason: NextTokenReason
}

/** The planned token at `index` could be played next: not flagged Maybe, playable now and no
 *  earlier planned token on its battle. */
export function playableNext(
  tokens: readonly PlannedToken[],
  index: number
): boolean {
  const token = tokens[index]
  return (
    token !== undefined &&
    !token.maybe &&
    token.playableNow &&
    !tokens
      .slice(0, index)
      .some(
        (earlier) =>
          earlier.laneId === token.laneId &&
          earlier.battleIndex === token.battleIndex
      )
  )
}

/**
 * The token the Next token card shows (design D4): the first planned token that is not flagged
 * Maybe, is playable now and has no earlier planned token on its battle, else the plan's first
 * token; null for an empty plan. A token is valued after every earlier token on its battle, so a
 * later token on a skipped token's battle would assume that skipped token was played.
 */
export function nextToken(
  plan: Pick<TokenPlan, "tokens">
): NextTokenChoice | null {
  const { tokens } = plan
  if (tokens.length === 0) return null
  const found = tokens.findIndex((_, index) => playableNext(tokens, index))
  const index = found === -1 ? 0 : found
  const token = tokens[index]!
  return {
    token,
    index,
    // The plan's first token is the best one available now; a later one was picked because the
    // tokens before it are flagged or not playable yet.
    reason: index === 0 ? "mostPoints" : "mostPointsPlayableNow",
  }
}

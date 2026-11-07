import {
  UNTRACKED_MISSION_KINDS,
  tokenMissionAmount,
  type LegendaryEventMissionRef,
  type LegendaryEventRun,
  type MissionAmount,
} from "@/entities/legendary-event"

import type { TokenMissionsInput } from "./token-missions"
import type { PlannedToken } from "./token-plan"
import type { RunTokenSection } from "./token-runs"

/** What one token adds to one open mission of its run. */
export interface TokenMissionStep {
  ref: LegendaryEventMissionRef
  /** The mission's count after this token (capped at `needed`). */
  total: number
  /** What this token adds to it. */
  gained: number
  needed: number
  /** This token finishes the mission. */
  completes: boolean
  estimate: boolean
}

/** One open mission of a run, as the Missions order reaches it. */
interface RunMissionStatus {
  ref: LegendaryEventMissionRef
  needed: number
  /** The count the run's planned tokens reach (capped at `needed`). */
  reached: number
  /** The plan index of the token that finishes it, or null when the run never does. */
  doneAt: number | null
  estimate: boolean
}

export interface RunMissionSummary {
  run: LegendaryEventRun
  /** Tracked open missions, in mission order. */
  missions: RunMissionStatus[]
  /** Open missions every token progresses (`anyBattle`, `winWithoutSummon`). */
  untracked: LegendaryEventMissionRef[]
  /** Missions the player ticked Done for this run; the order never counts them. */
  completed: LegendaryEventMissionRef[]
}

export interface MissionOrder {
  /** The plan's tokens, reordered inside each run; running points and slots follow the new order. */
  tokens: PlannedToken[]
  /** Per token (new plan index), the open missions it moves. */
  steps: TokenMissionStep[][]
  /** One per run section, in section order. */
  runs: RunMissionSummary[]
}

export interface MissionOrderInput {
  tokens: readonly PlannedToken[]
  sections: readonly Pick<RunTokenSection, "run" | "start" | "count">[]
  /** A run's open missions (`openMissions` for that run). */
  missionsOf: (run: LegendaryEventRun) => readonly LegendaryEventMissionRef[]
  /** A run's missions ticked Done (`completedMissions` for that run). */
  completedOf?: (run: LegendaryEventRun) => readonly LegendaryEventMissionRef[]
  membersOf: TokenMissionsInput["membersOf"]
  enemiesOf: TokenMissionsInput["enemiesOf"]
}

interface Tracked {
  ref: LegendaryEventMissionRef
  needed: number
  /** Every token progresses it (`UNTRACKED_MISSION_KINDS`): it finishes with the next token played. */
  untracked: boolean
  /** Its position among the run's tracked (measurable) missions, for their amounts. */
  slot: number
}

/** Per track, where its sequence stands: the current mission's position and what it still needs. */
type Cursors = { at: number; left: number }[]

interface Step {
  entry: Tracked
  /** The current mission's count after the token. */
  total: number
  /** What the token adds to it. */
  gained: number
  completes: boolean
  estimate: boolean
  /** What it moved, as a share of the mission (a finished one adds one more). */
  value: number
}

/**
 * One token played against the run's mission sequences (spec: missions are done in order): in each
 * track only the current mission counts it; when that mission finishes, the next one in order
 * becomes current from the next token on (no carry-over).
 */
function playToken(
  sequences: readonly (readonly Tracked[])[],
  cursors: Cursors,
  amounts: readonly (MissionAmount | null)[]
): Step[] {
  const steps: Step[] = []
  for (const [t, sequence] of sequences.entries()) {
    const cursor = cursors[t]!
    const entry = sequence[cursor.at]
    if (!entry) continue
    const amount = entry.untracked ? null : amounts[entry.slot]
    const moved = entry.untracked
      ? cursor.left
      : amount && amount.amount > 0
        ? Math.min(amount.amount, cursor.left)
        : 0
    if (moved <= 0) continue
    cursor.left -= moved
    const completes = cursor.left === 0
    steps.push({
      entry,
      total: entry.needed - cursor.left,
      gained: moved,
      completes,
      estimate: entry.untracked || (amount?.estimate ?? false),
      value: moved / entry.needed + (completes ? 1 : 0),
    })
    if (completes) {
      cursor.at += 1
      cursor.left = sequence[cursor.at]?.needed ?? 0
    }
  }
  return steps
}

const startCursors = (sequences: readonly (readonly Tracked[])[]): Cursors =>
  sequences.map((sequence) => ({ at: 0, left: sequence[0]?.needed ?? 0 }))

/**
 * The Missions order of the token plan (spec: Missions order): the same tokens, reordered inside
 * each run so its open missions finish as early as possible. Missions are done in order, so a token
 * moves only each track's current mission. A run's points are the sum of its tokens, so the order
 * inside a run costs no points. Tokens of one lane keep their relative order (a battle is played
 * after the one before it, and a battle's tokens clear its cells in turn). Tokens no run covers keep
 * their place.
 */
export function missionOrder(input: MissionOrderInput): MissionOrder {
  const tokens = [...input.tokens]
  const steps: TokenMissionStep[][] = tokens.map(() => [])
  const runs: RunMissionSummary[] = []

  for (const section of input.sections) {
    const open = input.missionsOf(section.run)
    const measured = open.filter(
      (entry) => !UNTRACKED_MISSION_KINDS.has(entry.mission.kind)
    )
    const sequences = sequencesOf(open, measured)
    const amountCache = new Map<PlannedToken, (MissionAmount | null)[]>()
    const amountsOf = (token: PlannedToken) => {
      let amounts = amountCache.get(token)
      if (!amounts) {
        const members = input.membersOf(token.teamId)
        const enemies = input.enemiesOf(token.laneId, token.battleIndex)
        amounts = measured.map((entry) =>
          tokenMissionAmount(entry.mission, members, enemies)
        )
        amountCache.set(token, amounts)
      }
      return amounts
    }

    const original = input.tokens.slice(
      section.start,
      section.start + section.count
    )
    const ordered = orderSection(original, sequences, amountsOf)
    const slots = original.map((token) => token.slot)

    const reached = measured.map(() => 0)
    const doneAt: (number | null)[] = measured.map(() => null)
    const estimate = measured.map(() => false)
    const cursors = startCursors(sequences)
    for (const [offset, token] of ordered.entries()) {
      const index = section.start + offset
      const slot = slots[offset]
      tokens[index] =
        slot === undefined ? { ...token } : { ...token, slot: slot }
      for (const step of playToken(sequences, cursors, amountsOf(token))) {
        const { entry } = step
        if (!entry.untracked) {
          reached[entry.slot] = step.total
          estimate[entry.slot] = estimate[entry.slot]! || step.estimate
          if (step.completes) doneAt[entry.slot] = index
        }
        steps[index]!.push({
          ref: entry.ref,
          total: step.total,
          gained: step.gained,
          needed: entry.needed,
          completes: step.completes,
          estimate: entry.untracked ? true : estimate[entry.slot]!,
        })
      }
    }
    runs.push({
      run: section.run,
      missions: measured.map((ref, m) => ({
        ref,
        needed: Math.max(1, ref.mission.count),
        reached: reached[m]!,
        doneAt: doneAt[m]!,
        estimate: estimate[m]!,
      })),
      untracked: open.filter((entry) =>
        UNTRACKED_MISSION_KINDS.has(entry.mission.kind)
      ),
      completed: [...(input.completedOf?.(section.run) ?? [])],
    })
  }

  // Running points follow the new order from the plan's starting points.
  const first = input.tokens[0]
  let running = first ? first.runningPoints - first.points : 0
  for (const [index, token] of tokens.entries()) {
    running += token.points
    tokens[index] = { ...token, runningPoints: running }
  }
  return { tokens, steps, runs }
}

/** The run's open missions as one ordered sequence per track. */
function sequencesOf(
  open: readonly LegendaryEventMissionRef[],
  measured: readonly LegendaryEventMissionRef[]
): Tracked[][] {
  const byTrack = new Map<string, Tracked[]>()
  for (const ref of open) {
    const untracked = UNTRACKED_MISSION_KINDS.has(ref.mission.kind)
    const sequence = byTrack.get(ref.track) ?? []
    sequence.push({
      ref,
      needed: Math.max(1, ref.mission.count),
      untracked,
      slot: untracked ? -1 : measured.indexOf(ref),
    })
    byTrack.set(ref.track, sequence)
  }
  return [...byTrack.values()]
}

/**
 * Greedy merge of the section's lane queues: each step plays the head of the lane whose best
 * prefix moves the current missions most per token (a finished mission counts double), so a lane
 * whose mission battle sits a few tokens deep is still reached. Ties keep plan order, so a run
 * without mission value stays in points order.
 */
function orderSection(
  tokens: readonly PlannedToken[],
  sequences: readonly (readonly Tracked[])[],
  amountsOf: (token: PlannedToken) => readonly (MissionAmount | null)[]
): PlannedToken[] {
  if (!sequences.some((sequence) => sequence.some((entry) => !entry.untracked)))
    return [...tokens]
  const queues = new Map<string, { token: PlannedToken; order: number }[]>()
  for (const [order, token] of tokens.entries()) {
    const queue = queues.get(token.laneId) ?? []
    queue.push({ token, order })
    queues.set(token.laneId, queue)
  }
  const cursors = startCursors(sequences)
  const result: PlannedToken[] = []
  const copy = (from: Cursors): Cursors => from.map((cursor) => ({ ...cursor }))
  const valueOf = (token: PlannedToken, state: Cursors) =>
    playToken(sequences, state, amountsOf(token)).reduce(
      (sum, step) => sum + step.value,
      0
    )

  while (result.length < tokens.length) {
    let best: { lane: string; rate: number; order: number } | null = null
    for (const [lane, queue] of queues) {
      if (queue.length === 0) continue
      const state = copy(cursors)
      let sum = 0
      let rate = 0
      for (const [k, entry] of queue.entries()) {
        sum += valueOf(entry.token, state)
        rate = Math.max(rate, sum / (k + 1))
      }
      const order = queue[0]!.order
      if (
        !best ||
        rate > best.rate + 1e-9 ||
        (Math.abs(rate - best.rate) <= 1e-9 && order < best.order)
      ) {
        best = { lane, rate, order }
      }
    }
    const queue = queues.get(best!.lane)!
    const { token } = queue.shift()!
    valueOf(token, cursors)
    result.push(token)
  }
  return result
}

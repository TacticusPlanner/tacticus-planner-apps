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
}

/**
 * The Missions order of the token plan (spec: Missions order): the same tokens, reordered inside
 * each run so its open missions finish as early as possible. A run's points are the sum of its
 * tokens, so the order inside a run costs no points. Tokens of one lane keep their relative order
 * (a battle is played after the one before it, and a battle's tokens clear its cells in turn).
 * Tokens no run covers keep their place.
 */
export function missionOrder(input: MissionOrderInput): MissionOrder {
  const tokens = [...input.tokens]
  const steps: TokenMissionStep[][] = tokens.map(() => [])
  const amountCache = new Map<PlannedToken, (MissionAmount | null)[]>()
  const runs: RunMissionSummary[] = []

  for (const section of input.sections) {
    const open = input.missionsOf(section.run)
    const tracked: Tracked[] = open
      .filter((entry) => !UNTRACKED_MISSION_KINDS.has(entry.mission.kind))
      .map((ref) => ({ ref, needed: Math.max(1, ref.mission.count) }))
    const amountsOf = (token: PlannedToken) => {
      let amounts = amountCache.get(token)
      if (!amounts) {
        const members = input.membersOf(token.teamId)
        const enemies = input.enemiesOf(token.laneId, token.battleIndex)
        amounts = tracked.map((entry) =>
          tokenMissionAmount(entry.ref.mission, members, enemies)
        )
        amountCache.set(token, amounts)
      }
      return amounts
    }

    const original = input.tokens.slice(
      section.start,
      section.start + section.count
    )
    const ordered = orderSection(original, tracked, amountsOf)
    const slots = original.map((token) => token.slot)

    const totals = tracked.map(() => 0)
    const doneAt: (number | null)[] = tracked.map(() => null)
    const estimate = tracked.map(() => false)
    for (const [offset, token] of ordered.entries()) {
      const index = section.start + offset
      const slot = slots[offset]
      tokens[index] =
        slot === undefined ? { ...token } : { ...token, slot: slot }
      const amounts = amountsOf(token)
      for (const [m, entry] of tracked.entries()) {
        const amount = amounts[m]
        if (!amount || amount.amount <= 0 || totals[m]! >= entry.needed) {
          continue
        }
        totals[m] = Math.min(entry.needed, totals[m]! + amount.amount)
        estimate[m] = estimate[m]! || amount.estimate
        const completes = totals[m] === entry.needed
        if (completes) doneAt[m] = index
        steps[index]!.push({
          ref: entry.ref,
          total: totals[m],
          needed: entry.needed,
          completes,
          estimate: estimate[m],
        })
      }
    }
    runs.push({
      run: section.run,
      missions: tracked.map((entry, m) => ({
        ref: entry.ref,
        needed: entry.needed,
        reached: totals[m]!,
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

/**
 * Greedy merge of the section's lane queues: each step plays the head of the lane whose best
 * prefix moves the unfinished missions most per token (a finished mission counts double), so a
 * lane whose mission battle sits a few tokens deep is still reached. Ties keep plan order, so a
 * run without mission value stays in points order.
 */
function orderSection(
  tokens: readonly PlannedToken[],
  tracked: readonly Tracked[],
  amountsOf: (token: PlannedToken) => readonly (MissionAmount | null)[]
): PlannedToken[] {
  if (tracked.length === 0) return [...tokens]
  const queues = new Map<string, { token: PlannedToken; order: number }[]>()
  for (const [order, token] of tokens.entries()) {
    const queue = queues.get(token.laneId) ?? []
    queue.push({ token, order })
    queues.set(token.laneId, queue)
  }
  const remaining = tracked.map((entry) => entry.needed)
  const result: PlannedToken[] = []

  const valueOf = (token: PlannedToken, left: number[]) => {
    let value = 0
    for (const [m, amount] of amountsOf(token).entries()) {
      if (!amount || amount.amount <= 0 || left[m]! <= 0) continue
      const moved = Math.min(amount.amount, left[m]!)
      value += moved / tracked[m]!.needed
      left[m] = left[m]! - moved
      if (left[m] === 0) value += 1
    }
    return value
  }

  while (result.length < tokens.length) {
    let best: { lane: string; rate: number; order: number } | null = null
    for (const [lane, queue] of queues) {
      if (queue.length === 0) continue
      const left = [...remaining]
      let sum = 0
      let rate = 0
      for (const [k, entry] of queue.entries()) {
        sum += valueOf(entry.token, left)
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
    valueOf(token, remaining)
    result.push(token)
  }
  return result
}

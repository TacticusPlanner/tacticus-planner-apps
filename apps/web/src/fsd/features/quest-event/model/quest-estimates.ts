import type { NpcRecord, NpcStatRow } from "@/entities/npc"
import { resolveLadderRow } from "@/entities/npc"

import { isBoardPickup, type QuestBattle } from "./quest-battles"
import {
  fullClearPoints,
  MAX_MEDALS,
  scoreQuest,
  type QuestBattleEntry,
  type QuestScore,
  type QuestScoring,
} from "./quest-score"
import type { QuestObjectiveBadge, QuestTeam } from "./quest-team"

/** A clear under this margin is "Close" (design D3); tune with calibration. */
const MARGINAL_MARGIN = 0.15
/**
 * The power ratio r: 1.0 until `calibrateQuestPowerRatio` has enough samples (design D5). While it is
 * uncalibrated the estimate block says so; drop that label when r is calibrated.
 */
const QUEST_POWER_RATIO = 1
const MIN_CALIBRATION_SAMPLES = 5
const CAP_GAINS_SHOWN = 3

/**
 * A battle's power B: its served `power` when recorded, else the sum of `count` × NPC power at the
 * enemy's ladder row over the enemies that are not board pickups. Null when an enemy is unknown, its
 * index is past its ladder, or its power cannot be computed.
 */
export function questBattlePower(
  battle: Pick<QuestBattle, "power" | "enemies">,
  npcOf: (id: string) => NpcRecord | undefined,
  powerOf: (npcId: string, row: NpcStatRow) => number | null
): number | null {
  if (battle.power !== null && battle.power !== undefined) return battle.power
  let total = 0
  for (const enemy of battle.enemies) {
    const npc = npcOf(enemy.id)
    if (isBoardPickup(enemy.id, npc)) continue
    const resolved = resolveLadderRow(npc, enemy.ladderIndex)
    if (!resolved) return null
    const power = powerOf(enemy.id, resolved.row)
    if (power === null) return null
    total += enemy.count * power
  }
  return total
}

export type QuestTeamEstimate = {
  power: number
  clears: boolean
  /** E ÷ (r × B) − 1. */
  margin: number
  marginal: boolean
  /** Points for a clear at 3 medals and full Lightning Victory with the objectives it keeps. */
  points: number
  /** The objective ticks a clear earns, in served order (feeds the projection). */
  objectives: boolean[]
}

type QuestGivenUp = { index: number; breakers: string[] }

export type QuestBattleEstimate =
  | { kind: "unknown" }
  | {
      kind: "ready"
      /** r × B. */
      required: number
      first: QuestTeamEstimate
      /** The hard-rules team, when the first estimate fails or is close and its team differs. */
      second:
        | (QuestTeamEstimate & { team: QuestTeam; givenUp: QuestGivenUp[] })
        | null
      /** 1 − E ÷ (r × B) of the better team, when neither clears. */
      shortfall: number | null
      /** The better team's members below the cap with the power they would gain at it. */
      capGains: { unitId: string; gain: number }[]
    }

/** Ticks per objective for a clear: every objective the badge does not rule out. */
function keptObjectives(badges: readonly QuestObjectiveBadge[]): boolean[] {
  return badges.map(
    (badge) =>
      badge.kind !== "unreachable" &&
      badge.kind !== "noEligible" &&
      badge.kind !== "notMet"
  )
}

function teamEstimate(
  team: QuestTeam,
  battle: Pick<QuestBattle, "objectives">,
  required: number,
  scoring: QuestScoring
): QuestTeamEstimate | null {
  if (team.totalPower === null) return null
  const objectives = keptObjectives(team.badges)
  const margin = required > 0 ? team.totalPower / required - 1 : 0
  const clears = team.totalPower >= required
  return {
    power: team.totalPower,
    clears,
    margin,
    marginal: clears && margin < MARGINAL_MARGIN,
    points:
      fullClearPoints(scoring) +
      battle.objectives.reduce(
        (sum, objective, index) =>
          sum + (objectives[index] ? objective.score : 0),
        0
      ),
    objectives,
  }
}

const sameMembers = (a: QuestTeam, b: QuestTeam) =>
  a.members.length === b.members.length &&
  a.members.every((member, index) => member.unitId === b.members[index]?.unitId)

/**
 * The two estimates of one battle (spec: quest-event-clear-estimates). The second, hard-rules team
 * is built only when the first fails or is close (design D2), and kept only when its members differ.
 * `gainAtCap` is a member's power at the full cap minus its capped power, or null.
 */
export function estimateQuestBattle(input: {
  battle: Pick<QuestBattle, "objectives">
  battlePower: number | null
  team: QuestTeam
  buildHardRulesTeam: () => QuestTeam
  gainAtCap: (unitId: string) => number | null
  scoring: QuestScoring
  ratio?: number
}): QuestBattleEstimate {
  const ratio = input.ratio ?? QUEST_POWER_RATIO
  if (input.battlePower === null) return { kind: "unknown" }
  const required = ratio * input.battlePower
  const first = teamEstimate(input.team, input.battle, required, input.scoring)
  if (!first) return { kind: "unknown" }

  let second: Extract<QuestBattleEstimate, { kind: "ready" }>["second"] = null
  if (!first.clears || first.marginal) {
    const team = input.buildHardRulesTeam()
    const estimate = sameMembers(team, input.team)
      ? null
      : teamEstimate(team, input.battle, required, input.scoring)
    if (estimate) {
      second = {
        ...estimate,
        team,
        givenUp: team.badges.flatMap((badge, index) =>
          badge.kind === "notMet" || badge.kind === "noEligible"
            ? [{ index, breakers: team.breakers[index] ?? [] }]
            : []
        ),
      }
    }
  }

  const neither = !first.clears && !second?.clears
  const better =
    second && second.power > first.power
      ? { estimate: second, team: second.team }
      : { estimate: first, team: input.team }
  const capGains = neither
    ? better.team.members
        .filter((member) => !member.featured && !member.atCap)
        .flatMap((member) => {
          const gain = input.gainAtCap(member.unitId)
          return gain !== null && gain > 0
            ? [{ unitId: member.unitId, gain }]
            : []
        })
        .sort((a, b) => b.gain - a.gain)
        .slice(0, CAP_GAINS_SHOWN)
    : []
  return {
    kind: "ready",
    required,
    first,
    second,
    shortfall:
      neither && required > 0 ? 1 - better.estimate.power / required : null,
    capGains,
  }
}

/** A battle row's verdict: "pending" while data loads (a dash), "unknown" without battle power. */
export type QuestVerdict = "clears" | "close" | "fails" | "unknown" | "pending"

export function questVerdict(
  estimate: QuestBattleEstimate | null | undefined
): QuestVerdict {
  if (!estimate) return "pending"
  if (estimate.kind === "unknown") return "unknown"
  if (!estimate.first.clears) return "fails"
  return estimate.first.marginal ? "close" : "clears"
}

export type QuestProjection = {
  score: QuestScore
  medals: number
}

/**
 * The projected quest (design D4): entered scores for battles with a medal, else the first estimate
 * when it clears, else the second, else nothing; scored by `scoreQuest`, so the rewards read it
 * unchanged. Never stored.
 */
export function projectQuest(
  battles: readonly QuestBattle[],
  entries: Readonly<Record<number, QuestBattleEntry | undefined>>,
  estimates: ReadonlyMap<number, QuestBattleEstimate>,
  crates: readonly { number: number; points: number }[],
  scoring: QuestScoring
): QuestProjection {
  const projected: Record<number, QuestBattleEntry> = {}
  let medals = 0
  for (const battle of battles) {
    const entry = entries[battle.number]
    if (entry && entry.medals > 0) {
      projected[battle.number] = entry
      medals += Math.min(entry.medals, MAX_MEDALS)
      continue
    }
    const estimate = estimates.get(battle.number)
    if (estimate?.kind !== "ready") continue
    const clear = estimate.first.clears
      ? estimate.first
      : estimate.second?.clears
        ? estimate.second
        : null
    if (!clear) continue
    projected[battle.number] = {
      medals: MAX_MEDALS,
      lightning: scoring.maxPointsForLightningVictory,
      objectives: clear.objectives,
    }
    medals += MAX_MEDALS
  }
  return { score: scoreQuest(battles, projected, crates, scoring), medals }
}

export type QuestCalibrationSample = { E: number; B: number; cleared: boolean }

/**
 * The power ratio the fewest samples contradict (design D5): a clear contradicts r when E < r × B, a
 * failure when E ≥ r × B. The tied range's median is returned; null with fewer than 5 samples.
 */
export function calibrateQuestPowerRatio(
  samples: readonly QuestCalibrationSample[]
): number | null {
  const usable = samples.filter((sample) => sample.B > 0)
  if (usable.length < MIN_CALIBRATION_SAMPLES) return null
  const ratios = [...new Set(usable.map((sample) => sample.E / sample.B))].sort(
    (a, b) => a - b
  )
  // Contradictions only change at a sample's E ÷ B, so test each and just past it.
  const candidates = [
    ...new Set(ratios.flatMap((ratio) => [ratio, ratio * (1 + 1e-9)])),
  ].sort((a, b) => a - b)
  const contradictions = (ratio: number) =>
    usable.filter((sample) =>
      sample.cleared
        ? sample.E < ratio * sample.B
        : sample.E >= ratio * sample.B
    ).length
  const counts = candidates.map(contradictions)
  const fewest = Math.min(...counts)
  const best = candidates.filter((_, index) => counts[index] === fewest)
  const low = best[0]!
  const high = best.at(-1)!
  return (low + high) / 2
}

import {
  UNTRACKED_MISSION_KINDS,
  tokenProgressesMission,
  type BattleEnemies,
  type LegendaryEventLaneId,
  type LegendaryEventMissionRef,
  type LegendaryEventUnit,
} from "@/entities/legendary-event"

import {
  playableNext,
  type NextTokenChoice,
  type PlannedToken,
  type TokenPlan,
} from "./token-plan"

/** What the planner reads to match tokens with missions (spec: legendary-event-missions). */
export interface TokenMissionsInput {
  plan: Pick<TokenPlan, "tokens">
  next: Pick<NextTokenChoice, "token" | "index">
  /** The current run's open missions (`openMissions`). */
  open: readonly LegendaryEventMissionRef[]
  /** A team's non-reserve members; the reserve never counts towards a mission. */
  membersOf: (teamId: string) => readonly LegendaryEventUnit[]
  /** The enemies of a lane battle (0-based index); undefined without served waves. */
  enemiesOf: (
    laneId: LegendaryEventLaneId,
    battleIndex: number
  ) => BattleEnemies | undefined
}

export interface MissionAlternative {
  token: PlannedToken
  /** Its position in the plan (0-based). */
  index: number
  missions: LegendaryEventMissionRef[]
  /** Its points minus the Next token's (zero or negative in a points-first plan). */
  pointsDifference: number
}

export interface NextTokenMissions {
  /** The open missions the Next token progresses, untracked kinds left out. */
  progressed: LegendaryEventMissionRef[]
  /** A playable planned token progressing more open missions, or null. */
  alternative: MissionAlternative | null
}

/**
 * The Next token card's missions (spec: Next token card shows missions it progresses and a For
 * missions alternative; design D4): the open missions the Next token progresses, and the eligible
 * planned token progressing the most of them when that is more, ties broken by points then plan
 * order. Untracked kinds (`anyBattle`, `winWithoutSummon`) progress every token, so they never pick one. The plan order stays.
 */
export function nextTokenMissions(
  input: TokenMissionsInput
): NextTokenMissions {
  const counted = input.open.filter(
    (entry) => !UNTRACKED_MISSION_KINDS.has(entry.mission.kind)
  )
  const progressedBy = (token: PlannedToken) => {
    const members = input.membersOf(token.teamId)
    const enemies = input.enemiesOf(token.laneId, token.battleIndex)
    return counted.filter((entry) =>
      tokenProgressesMission(entry.mission, members, enemies)
    )
  }
  const { tokens } = input.plan
  const next = input.next.token
  const progressed = progressedBy(next)

  let best: MissionAlternative | null = null
  for (const [index, token] of tokens.entries()) {
    if (index === input.next.index || !playableNext(tokens, index)) continue
    const missions = progressedBy(token)
    if (missions.length <= progressed.length) continue
    // Tokens come in plan order, so an equal count with equal points keeps the earlier one.
    if (
      best &&
      (missions.length < best.missions.length ||
        (missions.length === best.missions.length &&
          token.points <= best.token.points))
    ) {
      continue
    }
    best = {
      token,
      index,
      missions,
      pointsDifference: token.points - next.points,
    }
  }
  return { progressed, alternative: best }
}

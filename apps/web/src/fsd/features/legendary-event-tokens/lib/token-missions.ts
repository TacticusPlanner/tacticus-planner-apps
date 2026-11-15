import {
  UNTRACKED_MISSION_KINDS,
  currentMissions,
  tokenMissionAmount,
  tokenProgressesMission,
  type BattleEnemies,
  type LegendaryEventLaneId,
  type LegendaryEventMissionRef,
  type LegendaryEventUnit,
} from "@/entities/legendary-event"

import type { NextTokenChoice, PlannedToken } from "./token-plan"

/** What the planner reads to match tokens with missions (spec: legendary-event-missions). */
export interface TokenMissionsInput {
  next: Pick<NextTokenChoice, "token">
  /** The current run's open missions (`openMissions`); only each track's current one counts. */
  open: readonly LegendaryEventMissionRef[]
  /** A team's non-reserve members; the reserve never counts towards a mission. */
  membersOf: (teamId: string) => readonly LegendaryEventUnit[]
  /** The enemies of a lane battle (0-based index); undefined without served waves. */
  enemiesOf: (
    laneId: LegendaryEventLaneId,
    battleIndex: number
  ) => BattleEnemies | undefined
}

/** A mission a token progresses, with what it adds. */
export interface MissionProgress {
  ref: LegendaryEventMissionRef
  /** What one play adds to the mission's count, 0 when it can't be counted (an estimate when the
   *  count is guessed). */
  amount: number
  estimate: boolean
}

export interface NextTokenMissions {
  /** The current missions the Next token progresses, untracked kinds left out. */
  progressed: MissionProgress[]
}

/**
 * The Next token card's missions (spec: Next token card shows missions it progresses): the current
 * missions (missions are done in order, so only each track's current one counts) the Next token
 * progresses, with what it adds. The card shows one token only; the Missions order is the
 * missions-first answer.
 */
export function nextTokenMissions(
  input: TokenMissionsInput
): NextTokenMissions {
  return { progressed: tokenMissionProgress(input, input.next.token) }
}

/** The current missions (each track's first open one, untracked kinds left out) `token`
 *  progresses, with what one play adds. */
export function tokenMissionProgress(
  input: Pick<TokenMissionsInput, "open" | "membersOf" | "enemiesOf">,
  token: Pick<PlannedToken, "teamId" | "laneId" | "battleIndex">
): MissionProgress[] {
  const members = input.membersOf(token.teamId)
  const enemies = input.enemiesOf(token.laneId, token.battleIndex)
  return currentMissions(input.open)
    .filter((entry) => !UNTRACKED_MISSION_KINDS.has(entry.mission.kind))
    .flatMap((ref) => {
      if (!tokenProgressesMission(ref.mission, members, enemies)) return []
      const amount = tokenMissionAmount(ref.mission, members, enemies)
      return [
        {
          ref,
          amount: amount?.amount ?? 0,
          estimate: amount?.estimate ?? true,
        },
      ]
    })
}

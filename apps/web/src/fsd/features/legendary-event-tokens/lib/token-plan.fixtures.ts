import {
  buildLanePointsModel,
  type LegendaryEventAnnotation,
  type LegendaryEventLaneId,
  type LegendaryEventLaneRecord,
} from "@/entities/legendary-event"
import { utharEvent } from "@/test/fixtures/legendary-events"

import type { TokenPlanLane, TokenPlanTeam } from "./token-plan"

// The worked Uthar Alpha example of spec `legendary-event-token-plan`: battle 1 has defeat-all and
// Ultramarines cleared at a full high score of 29, battle 2 defeat-all at 31; two Alpha teams.

/** `ultraCalgar`, `ultraTigurius`, `ultraTitus`, `ultraApothecary`, `ultraEliminatorSgt`:
 *  Ultramarines only, Stage 5 estimated depth 6. */
export const fiveTeam: TokenPlanTeam = {
  id: "five",
  name: "Five",
  objectiveIndexes: [0],
  depth: 6,
}

/** `ultraCalgar`, `ultraTitus`, `ultraApothecary`: Ultramarines and Melee, stored depth 5. */
export const meleeTeam: TokenPlanTeam = {
  id: "melee",
  name: "Melee",
  objectiveIndexes: [0, 3],
  depth: 5,
}

export const workedAlphaRecord = {
  encounters: [
    { objectivesCleared: [0, 1], highScore: 29, encounterPoints: 29 },
    { objectivesCleared: [0], highScore: 31, encounterPoints: 31 },
  ],
} as unknown as LegendaryEventLaneRecord

export const mark = (
  battleIndex: number,
  objectiveId: number,
  status: LegendaryEventAnnotation["status"],
  laneId: LegendaryEventLaneId = "alpha"
): LegendaryEventAnnotation => ({
  laneId,
  battleIndex,
  objectiveId,
  status,
  updatedAt: "2026-10-15T00:00:00Z",
})

export function utharLane(
  laneId: LegendaryEventLaneId,
  overrides: Partial<Omit<TokenPlanLane, "laneId" | "model">> = {}
): TokenPlanLane {
  return {
    laneId,
    model: buildLanePointsModel(utharEvent[laneId]),
    synced: undefined,
    teams: [],
    annotations: [],
    ...overrides,
  }
}

/** The three Uthar lanes with the worked Alpha state and no teams on Beta or Gamma. */
export function workedLanes(
  alpha: Partial<Omit<TokenPlanLane, "laneId" | "model">> = {}
): TokenPlanLane[] {
  return [
    utharLane("alpha", {
      synced: workedAlphaRecord,
      teams: [fiveTeam, meleeTeam],
      ...alpha,
    }),
    utharLane("beta"),
    utharLane("gamma"),
  ]
}

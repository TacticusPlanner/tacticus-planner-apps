import {
  CLEAR_ESTIMATE_CURVE_VERSION,
  type ClearEstimate,
} from "@/entities/legendary-event"

/** Where a depth was set from (analytics): the team card's stepper, the team editor, or a Next
 *  token card action. */
export type DepthSetSource = "card" | "editor" | "tokenAction"

/** The estimate shown when a depth was edited (null when none was shown), and the rest of what the
 *  player saw for tuning the curve; the optional fields read as null when absent. */
export interface DepthEstimateContext {
  estimate: number | null
  fromEstimate: boolean
  sureDepth?: number | null
  stretchDepth?: number | null
  effectivePower?: number | null
  teamPower?: number | null
  memberCount?: number | null
  unitIds?: readonly string[] | null
  objectiveIndexes?: readonly number[] | null
  /** Each member's power without horde-mode multipliers, in `unitIds` order. */
  memberPowers?: readonly number[] | null
  source?: DepthSetSource
}

/** The context of a depth edit from the estimate the player saw. */
export function depthEstimateContext(
  estimate: ClearEstimate | null,
  team: {
    fromEstimate: boolean
    teamPower: number | null
    memberCount: number | null
    unitIds: readonly string[] | null
    objectiveIndexes: readonly number[] | null
    memberPowers?: readonly number[] | null
    source: DepthSetSource
  }
): DepthEstimateContext {
  return {
    estimate: estimate?.depth ?? null,
    sureDepth: estimate?.sureDepth ?? null,
    stretchDepth: estimate?.stretchDepth ?? null,
    effectivePower: estimate?.power ?? null,
    ...team,
  }
}

/** The analytics snapshot of a depth edit's context (every field present, curve version added). */
export function estimateSnapshot(shown: DepthEstimateContext) {
  return {
    sureDepth: shown.sureDepth ?? null,
    stretchDepth: shown.stretchDepth ?? null,
    effectivePower: shown.effectivePower ?? null,
    teamPower: shown.teamPower ?? null,
    memberCount: shown.memberCount ?? null,
    unitIds: shown.unitIds ?? null,
    objectiveIndexes: shown.objectiveIndexes ?? null,
    memberPowers: shown.memberPowers ?? null,
    topMemberShare: topMemberShare(shown.memberPowers),
    curveVersion: CLEAR_ESTIMATE_CURVE_VERSION,
  }
}

/** The strongest member's share of the members' summed power; null without powers or when they sum
 *  to 0 (no member owned). Rounded to 3 decimals. */
function topMemberShare(
  powers: readonly number[] | null | undefined
): number | null {
  if (!powers || powers.length === 0) return null
  const total = powers.reduce((sum, power) => sum + power, 0)
  if (total <= 0) return null
  return Math.round((Math.max(...powers) / total) * 1000) / 1000
}

import { useCallback } from "react"
import { useTranslation } from "react-i18next"

import { coreCount, coreMowCount } from "../lib/team-rules"
import type { TeamRuleInput } from "../lib/team-rules"
import { TEAM_LIMITS } from "./team-modes"
import { useSurvivalRuleCap } from "./use-survival-caps"
import type { TeamMode, TeamRuleCode } from "./types"

/** A rule's copy keys under `teams:rules`: every code the contract defines must have one, so a
 *  code the API adds fails the typecheck until it has copy (design D3). `counted` fixes take how
 *  many units to change. */
const RULE_COPY = {
  nameLength: { counted: false },
  noMode: { counted: false },
  tooFewCharacters: { counted: true },
  unknownUnit: { counted: false },
  modeNotCombinable: { counted: false },
  tooManyCoreCharacters: { counted: true },
  tooManyCoreMows: { counted: true },
  mowsNotAllowed: { counted: false },
  campaignRequired: { counted: false },
  unknownCampaign: { counted: false },
  coreCharacterMissing: { counted: false },
  factionNotAllowed: { counted: false },
  incursionRequired: { counted: false },
  unknownIncursion: { counted: false },
  noSharedIncursionFaction: { counted: false },
  survivalModeRequired: { counted: false },
  unknownSurvivalEvent: { counted: false },
  survivalFeaturedCharacter: { counted: false },
  survivalTooManyCharacters: { counted: false },
} as const satisfies Record<TeamRuleCode, { counted: boolean }>

/** How many units a counted fix asks the player to change, for this team. */
function fixCount(
  code: TeamRuleCode,
  team: Pick<
    TeamRuleInput,
    "characterIds" | "flexStartIndex" | "mowIds" | "mowFlexStartIndex"
  >
) {
  if (code === "tooFewCharacters") {
    return Math.max(1, TEAM_LIMITS.minCharacters - team.characterIds.length)
  }
  if (code === "tooManyCoreCharacters") {
    return Math.max(1, coreCount(team) - TEAM_LIMITS.maxWarCoreCharacters)
  }
  return Math.max(1, coreMowCount(team) - TEAM_LIMITS.maxWarCoreMows)
}

export interface TeamRuleText {
  code: TeamRuleCode
  /** What is wrong. */
  reason: string
  /** How to fix it in the editor. */
  fix: string
}

/**
 * A rule code's translated reason and fix, never the raw code. `team` sizes counted fixes, and its
 * Survival event gives the caps the Survival rules name (a generic line while that is unknown).
 */
export function useTeamRuleText() {
  const { t } = useTranslation("teams")
  const survivalCap = useSurvivalRuleCap()
  return useCallback(
    (
      code: TeamRuleCode,
      team?: Pick<
        TeamRuleInput,
        | "characterIds"
        | "flexStartIndex"
        | "mowIds"
        | "mowFlexStartIndex"
        | "survivalEventKey"
      >
    ): TeamRuleText => {
      // `issues` are filtered to known codes when read (`withKnownIssues`); this guard keeps an
      // unknown code from throwing while rendering if one still gets through.
      const counted =
        (RULE_COPY as Partial<Record<string, { counted: boolean }>>)[code]
          ?.counted ?? false
      const max = survivalCap(code, team?.survivalEventKey)
      const capped = { max, context: max === undefined ? "unknown" : undefined }
      if (code === "survivalTooManyCharacters") {
        return {
          code,
          reason: t(`rules.${code}.reason`, capped),
          fix: t(`rules.${code}.fix`, capped),
        }
      }
      return {
        code,
        reason: t(`rules.${code}.reason`),
        fix: counted
          ? t(`rules.${code as "tooManyCoreMows"}.fix`, {
              count: team ? fixCount(code, team) : 1,
            })
          : t(`rules.${code as "noMode"}.fix`),
      }
    },
    [t, survivalCap]
  )
}

/** A mode's translated name. */
export function useTeamModeLabel() {
  const { t } = useTranslation("teams")
  return useCallback((mode: TeamMode) => t(`modes.${mode}`), [t])
}

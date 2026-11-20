import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { progressionRarity } from "@workspace/game-domain"

import {
  TEAM_LIMITS,
  coreCount,
  coreMowCount,
  underCap,
  useTeamRuleText,
} from "@/entities/team"
import type { Team, TeamRoster, TeamRuleCode } from "@/entities/team"
import { useUnitName } from "@/shared/unit-name"

/** One status chip: one fact, never two (design D11, handoff 5.7). */
export interface TeamStatusItem {
  key: string
  kind: "cap" | "error" | "warn"
  text: string
  /** The full reason and its fix, for a rule chip. */
  title?: string
}

/** How many of the team's units are under its saved cap's targets; 0 without a cap or roster. */
function countUnderCap(team: Team, roster: TeamRoster | null) {
  const cap = team.rarityCap
  if (!cap || !roster) return 0
  const under = (unit: ReturnType<TeamRoster["characters"]["get"]>) =>
    unit !== undefined && underCap(unit, cap, progressionRarity).any
  return (
    team.characterIds.filter((id) => under(roster.characters.get(id))).length +
    team.mowIds.filter((id) => under(roster.mows.get(id))).length
  )
}

/**
 * A team's status chips, in the order cap, broken rules, then warnings (shared units, units under
 * its cap). `shared` is each team's units shared with another team of a common mode.
 */
export function useTeamStatus(
  shared: ReadonlyMap<string, readonly string[]>,
  roster: TeamRoster | null
) {
  const { t } = useTranslation(["teams", "progression"])
  const unitName = useUnitName()
  const ruleText = useTeamRuleText()

  return useCallback(
    (team: Team): TeamStatusItem[] => {
      const items: TeamStatusItem[] = []
      if (team.rarityCap) {
        items.push({
          key: "cap",
          kind: "cap",
          text: t("chips.cap", {
            rarity: t(`progression:rarities.${team.rarityCap}`),
          }),
        })
      }
      const ruleChip = (code: TeamRuleCode) => {
        if (code === "tooFewCharacters") {
          return t("chips.rules.tooFewCharacters", {
            count: team.characterIds.length,
            min: TEAM_LIMITS.minCharacters,
          })
        }
        if (code === "tooManyCoreCharacters") {
          return t("chips.rules.tooManyCoreCharacters", {
            count: coreCount(team),
            max: TEAM_LIMITS.maxWarCoreCharacters,
          })
        }
        if (code === "tooManyCoreMows") {
          return t("chips.rules.tooManyCoreMows", {
            count: coreMowCount(team),
            max: TEAM_LIMITS.maxWarCoreMows,
          })
        }
        return t(`chips.rules.${code}`)
      }
      for (const code of team.issues) {
        const full = ruleText(code, team)
        items.push({
          key: `rule-${code}`,
          kind: "error",
          text: ruleChip(code),
          title: `${full.reason} ${full.fix}`,
        })
      }
      for (const unitId of shared.get(team.id) ?? []) {
        const kind = team.characterIds.includes(unitId) ? "Character" : "Mow"
        items.push({
          key: `shared-${unitId}`,
          kind: "warn",
          text: t("chips.shared", { unit: unitName(kind, unitId) }),
        })
      }
      const under = countUnderCap(team, roster)
      if (under > 0) {
        items.push({
          key: "under-cap",
          kind: "warn",
          text: t("chips.underCap", { count: under }),
        })
      }
      return items
    },
    [t, ruleText, shared, roster, unitName]
  )
}

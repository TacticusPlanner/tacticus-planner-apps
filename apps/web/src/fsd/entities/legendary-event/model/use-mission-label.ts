import { useCallback } from "react"
import { useTranslation } from "react-i18next"

import type { LegendaryEventMission } from "../lib/missions"

const NAMESPACES = [
  "legendaryEvents",
  "traits",
  "damageTypes",
  "factions",
  "common",
] as const

const KNOWN_KINDS = new Set([
  "anyBattle",
  "defeatFaction",
  "useAbilitiesWithAlliance",
  "damageType",
  "defeatWithAlliance",
  "winWithoutTrait",
  "winWithoutSummon",
  "defeatWithDamageType",
])

/**
 * A resolver from a mission to its localized label (spec: missions are typed requirements with
 * translated labels): the `legendaryEvents:missions.kinds.*` template with the faction, alliance,
 * damage type and trait names from their game-data namespaces (the id when one is missing). A kind
 * this client does not know reads as the served English `text`.
 */
export function useMissionLabel(): (mission: LegendaryEventMission) => string {
  const { t, i18n } = useTranslation(NAMESPACES)
  return useCallback(
    (mission) => {
      if (!KNOWN_KINDS.has(mission.kind)) return mission.text
      const entry = (key: string, fallback: string | null) =>
        i18n.exists(key) ? String(i18n.t(key as never)) : (fallback ?? "")
      const kind =
        mission.kind === "defeatFaction" && mission.trait
          ? "defeatTrait"
          : mission.kind
      return t(`legendaryEvents:missions.kinds.${kind}` as never, {
        count: mission.count,
        faction: entry(`factions:${mission.faction}`, mission.faction),
        alliance: entry(
          `common:alliances.${mission.alliance}`,
          mission.alliance
        ),
        damageType: entry(
          `damageTypes:${mission.damageType}`,
          mission.damageType
        ),
        trait: entry(`traits:${mission.trait}`, mission.trait),
      })
    },
    [i18n, t]
  )
}

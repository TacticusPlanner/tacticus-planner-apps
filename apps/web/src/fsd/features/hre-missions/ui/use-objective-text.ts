import { useCallback } from "react"
import { useTranslation } from "react-i18next"

import type { HreObjective } from "../model/hre-missions"
import { objectiveTextKey } from "../model/hre-objective-text"
import type { HreFeaturedHero } from "../model/use-hre-instance"

/** Words an objective for the shown event's hero: alliance, faction and damage type localized. */
export function useObjectiveText(
  hero: HreFeaturedHero | null,
  featuredCharacterId: string | null
) {
  const { t, i18n } = useTranslation([
    "hre",
    "common",
    "characters",
    "factions",
    "damageTypes",
  ])
  return useCallback(
    (objective: HreObjective) => {
      const heroName = hero
        ? t(`characters:${hero.id}`, { defaultValue: hero.name })
        : (featuredCharacterId ?? "")
      const { key, values } = objectiveTextKey(objective, {
        alliance: hero
          ? (t(`common:alliances.${hero.alliance}` as never, {
              defaultValue: hero.alliance,
            }) as string)
          : null,
        hero: heroName,
        formatNumber: (value) => value.toLocaleString(i18n.language),
      })
      const qualifier =
        objective.kind === "killFaction"
          ? t(`factions:${objective.qualifier}`, {
              defaultValue: objective.qualifier,
            })
          : objective.kind === "damageType"
            ? t(`damageTypes:${objective.qualifier}`, {
                defaultValue: objective.qualifier,
              })
            : ""
      return t(`hre:${key}` as never, { ...values, qualifier }) as string
    },
    [hero, featuredCharacterId, t, i18n.language]
  )
}

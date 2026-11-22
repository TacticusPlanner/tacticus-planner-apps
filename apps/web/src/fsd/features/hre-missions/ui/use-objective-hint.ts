import { useCallback } from "react"
import { useTranslation } from "react-i18next"

import type { HreObjective } from "@/entities/hre-mission"
import { hintGameMode, objectiveHint } from "../model/hre-objective-hint"
import type { HreFeaturedHero } from "../model/use-hre-instance"

/**
 * The game's own hint for an objective (`hreTaskHints`, generated from the datamine), in the UI
 * language with English as the fallback, its placeholders filled with the event's alliance, hero,
 * faction, damage type and mode names. Undefined when the game has no hint for it.
 */
export function useObjectiveHint(
  hero: HreFeaturedHero | null,
  featuredCharacterId: string | null
) {
  const { t, i18n } = useTranslation([
    "hreTaskHints",
    "hre",
    "common",
    "characters",
    "factions",
    "damageTypes",
  ])
  return useCallback(
    (objective: HreObjective) => {
      const lookup = (key: string) =>
        (i18n.getResource(i18n.language, "hreTaskHints", key) ??
          i18n.getResource("en", "hreTaskHints", key)) as string | undefined
      const mode = hintGameMode(objective)
      const qualifier = objective.qualifier ?? ""
      return objectiveHint(objective, lookup, {
        TARGET_AMOUNT: objective.target.toLocaleString(i18n.language),
        FACTION_TRAIT: hero
          ? t(`common:alliances.${hero.alliance}` as never, {
              defaultValue: hero.alliance,
            })
          : "",
        HERO_NAME: hero
          ? t(`characters:${hero.id}`, { defaultValue: hero.name })
          : (featuredCharacterId ?? ""),
        FACTION_NAME: t(`factions:${qualifier}`, { defaultValue: qualifier }),
        DAMAGE_TYPE: t(`damageTypes:${qualifier}`, { defaultValue: qualifier }),
        GAME_MODE: mode ? t(`hre:tokens.modes.${mode}`) : "",
      })
    },
    [hero, featuredCharacterId, t, i18n]
  )
}

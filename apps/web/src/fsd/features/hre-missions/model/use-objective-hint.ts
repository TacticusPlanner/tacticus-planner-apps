import { useCallback } from "react"
import { useTranslation } from "react-i18next"

import { numberFormat } from "@/shared/lib"
import type { HreObjective } from "@/entities/hre-mission"
import { hintGameMode, hintLookup, objectiveHint } from "./hre-objective-hint"
import type { HreFeaturedHero } from "./use-hre-instance"

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
      const lookup = hintLookup(i18n.languages, (language, key) =>
        i18n.getResource(language, "hreTaskHints", key)
      )
      const mode = hintGameMode(objective)
      const qualifier = objective.qualifier ?? ""
      return objectiveHint(objective, lookup, {
        TARGET_AMOUNT: numberFormat(i18n.language).format(objective.target),
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

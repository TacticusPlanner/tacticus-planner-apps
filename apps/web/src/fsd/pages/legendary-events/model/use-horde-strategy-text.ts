import { useCallback } from "react"
import { useTranslation } from "react-i18next"

import {
  parseHordeStrategyText,
  withStrategyFallback,
  type HordeStrategyText,
} from "../lib/horde-strategy"

/** Resolves a character's horde-mode strategy text from the `hordeStrategy` namespace in the
 *  reader's language, field by field falling back to English. */
export function useHordeStrategyText() {
  const { i18n } = useTranslation("hordeStrategy")

  return useCallback(
    (unitId: string): HordeStrategyText =>
      withStrategyFallback(
        parseHordeStrategyText(
          i18n.getResource(
            i18n.resolvedLanguage ?? i18n.language,
            "hordeStrategy",
            unitId
          )
        ),
        parseHordeStrategyText(i18n.getResource("en", "hordeStrategy", unitId))
      ),
    [i18n]
  )
}

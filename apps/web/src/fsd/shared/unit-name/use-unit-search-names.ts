import { useCallback } from "react"
import { useTranslation } from "react-i18next"

const none: readonly string[] = []

/**
 * The game's other names for a Character or MoW, by id: its short and full names, in the current
 * language and in English (`unitSearchNames`, generated with the display names). The game shows a
 * unit by its extra short name ("Nauseous"), but players search by the names V1 and the game's
 * unit pages show ("Rotbone", "Boss Gulgortz"), so unit searches match these besides the displayed
 * name. Empty for an id the namespace doesn't know (NPCs, a unit without other names).
 *
 * The resolver is referentially stable while the namespace and the language are unchanged.
 */
export function useUnitSearchNames() {
  const { t } = useTranslation("unitSearchNames")

  return useCallback(
    (unitId: string): readonly string[] => {
      const names: unknown = t(unitId, {
        returnObjects: true,
        defaultValue: none,
      })
      return Array.isArray(names) ? (names as string[]) : none
    },
    [t]
  )
}

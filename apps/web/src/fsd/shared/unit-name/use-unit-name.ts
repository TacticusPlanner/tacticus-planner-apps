import { useTranslation } from "react-i18next"
import { useLiveQuery } from "dexie-react-hooks"
import { getCharactersMap, getMowsMap } from "@workspace/game-catalog/queries"

/**
 * Display name for a unit (Character or Mow) by id — the single copy every layer shares. It used to
 * exist twice: inside `pages/goals`' `useGoalCatalog` and, duplicated, inside
 * `features/v1-import`'s report, because a feature may import neither a page nor a sibling feature.
 * `shared/ability-text` is the precedent for catalog-plus-i18n text resolution living here.
 *
 * Falls back to the raw id whenever the catalog doesn't know it — which is exactly the V1 import's
 * unknown-unit case, where the raw V1 identifier is the whole point of that fallback.
 */
export function useUnitName() {
  const { t } = useTranslation(["characters", "mows"])
  const charactersById = useLiveQuery(() => getCharactersMap(), [])
  const mowsById = useLiveQuery(() => getMowsMap(), [])

  return (entityType: string | null, entityId: string | null): string => {
    if (!entityId) return ""
    if (entityType === "Mow") {
      const record = mowsById?.get(entityId)
      return t(`mows:${entityId}`, { defaultValue: record?.name ?? entityId })
    }
    if (entityType !== "Character") return entityId

    const record = charactersById?.get(entityId)
    return t(`characters:${entityId}`, {
      defaultValue: record?.name ?? entityId,
    })
  }
}

import { useTranslation } from "react-i18next"
import { useLiveQuery } from "dexie-react-hooks"
import { getCharactersMap, getMowsMap } from "@workspace/game-catalog/queries"

/**
 * Display name for an outcome's unit, by id. Mirrors `pages/goals/model/shared/use-goal-catalog.ts`'s
 * `getEntityName` (duplicated rather than imported — FSD forbids a feature depending on a page,
 * and this feature needs only the name lookup, not that hook's whole catalog).
 *
 * Falls back to the raw id when it isn't in the catalog — which is exactly the unknown-unit case
 * (design.md: "falls back to the raw V1 identifier ... which is the whole point of that case").
 */
export function useEntityDisplayName() {
  const { t } = useTranslation("characters")
  const charactersById = useLiveQuery(() => getCharactersMap(), [])
  const mowsById = useLiveQuery(() => getMowsMap(), [])

  return (entityType: string | null, entityId: string | null): string => {
    if (!entityId) return ""
    if (entityType === "Mow") return mowsById?.get(entityId)?.name ?? entityId
    if (entityType !== "Character") return entityId

    const record = charactersById?.get(entityId)
    return t(entityId, { defaultValue: record?.name ?? entityId })
  }
}

import { useCallback } from "react"
import { useTranslation } from "react-i18next"

import { toById, useCatalogDataset } from "@/shared/local-data"

/**
 * Display name for a unit (Character or Mow) by id — the single copy every layer shares. It used to
 * exist twice: inside `pages/goals`' `useGoalCatalog` and, duplicated, inside
 * `features/v1-import`'s report, because a feature may import neither a page nor a sibling feature.
 * `shared/ability-text` is the precedent for catalog-plus-i18n text resolution living here.
 *
 * Falls back to the raw id whenever the catalog doesn't know it — which is exactly the V1 import's
 * unknown-unit case, where the raw V1 identifier is the whole point of that fallback.
 *
 * The resolver is referentially stable while the two datasets and the language are unchanged, so
 * effects and memos can list it as a dependency.
 */
export function useUnitName() {
  const { t } = useTranslation(["characters", "mows"])
  const characters = useCatalogDataset("characters", toById)
  const mows = useCatalogDataset("mows", toById)
  const charactersById =
    characters.status === "ready" ? characters.data : undefined
  const mowsById = mows.status === "ready" ? mows.data : undefined

  return useCallback(
    (entityType: string | null, entityId: string | null): string => {
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
    },
    [t, charactersById, mowsById]
  )
}

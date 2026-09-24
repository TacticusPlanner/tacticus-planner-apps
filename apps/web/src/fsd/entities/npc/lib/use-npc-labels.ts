import { useCallback } from "react"
import { useTranslation } from "react-i18next"

import type { NpcGroup } from "../model/types"

/**
 * id -> localized NPC name via the id-keyed `npcs` namespace (ported from V1's game localization),
 * falling back to the served catalog name. A group's name is its default variation's name.
 */
export function useNpcLabels() {
  const { t } = useTranslation(["npcs", "factions"])

  const variationName = useCallback(
    (variationId: string, catalogName: string) =>
      t(`npcs:${variationId}`, { defaultValue: catalogName }),
    [t]
  )

  const groupName = useCallback(
    (group: NpcGroup) => variationName(group.defaultVariationId, group.name),
    [variationName]
  )

  const factionName = useCallback(
    (factionId: string) =>
      t(`factions:${factionId}`, { defaultValue: factionId }),
    [t]
  )

  return { variationName, groupName, factionName }
}

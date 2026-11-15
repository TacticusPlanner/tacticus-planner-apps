import { useCallback } from "react"
import { useTranslation } from "react-i18next"

import { parseNpcThreatText, type NpcThreatText } from "../lib/npc-threat"

/** Resolves an enemy NPC's threat text from the `npcThreats` namespace in the reader's language,
 *  field by field falling back to English. */
export function useNpcThreatText() {
  const { i18n } = useTranslation("npcThreats")

  return useCallback(
    (npcId: string): NpcThreatText => ({
      ...parseNpcThreatText(i18n.getResource("en", "npcThreats", npcId)),
      ...parseNpcThreatText(
        i18n.getResource(
          i18n.resolvedLanguage ?? i18n.language,
          "npcThreats",
          npcId
        )
      ),
    }),
    [i18n]
  )
}

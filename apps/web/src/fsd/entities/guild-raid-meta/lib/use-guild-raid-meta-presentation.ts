import {
  getCharactersMap,
  getGuildRaidMeta,
  getMowsMap,
} from "@workspace/game-catalog/queries"
import { useLiveQuery } from "dexie-react-hooks"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { createGuildRaidMetaPresentationResolver } from "./resolve-guild-raid-meta"

/** Reactive entity entry point for future Guild Raid Meta consumers. */
export function useGuildRaidMetaPresentation() {
  const { t } = useTranslation("raidBosses")
  const catalog = useLiveQuery(async () => {
    const [meta, charactersById, mowsById] = await Promise.all([
      getGuildRaidMeta(),
      getCharactersMap(),
      getMowsMap(),
    ])
    return { meta, charactersById, mowsById }
  })

  return useMemo(() => {
    const meta = catalog?.meta
    if (!catalog || !meta) {
      return null
    }

    return createGuildRaidMetaPresentationResolver({
      meta,
      charactersById: catalog.charactersById,
      mowsById: catalog.mowsById,
      bossName: (bossUnitSetId, fallback) =>
        t(`raidBosses:${bossUnitSetId}`, { defaultValue: fallback }),
    })
  }, [catalog, t])
}

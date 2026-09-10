import {
  getCharactersMap,
  getGuildRaidMeta,
  getMowsMap,
} from "@workspace/game-catalog/queries"
import type { GameCatalogGuildRaidMeta } from "@workspace/game-catalog"
import { useLiveQuery } from "dexie-react-hooks"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { createGuildRaidMetaPresentationResolver } from "./resolve-guild-raid-meta"

const FAILED = Symbol("guild-raid-meta-failed")

export type GuildRaidMetaCatalog =
  | {
      status: "loading" | "absent" | "failed"
      meta?: undefined
      retry: () => void
    }
  | {
      status: "ready"
      meta: GameCatalogGuildRaidMeta
      presentation: ReturnType<typeof createGuildRaidMetaPresentationResolver>
      retry: () => void
    }

/** Reactive public entity API for data and presentation consumed by Guild Raid Meta views. */
export function useGuildRaidMetaCatalog(): GuildRaidMetaCatalog {
  const { t } = useTranslation("raidBosses")
  const [retryNonce, setRetryNonce] = useState(0)
  const retry = useCallback(() => setRetryNonce((value) => value + 1), [])
  const catalog = useLiveQuery(async () => {
    try {
      const [meta, charactersById, mowsById] = await Promise.all([
        getGuildRaidMeta(),
        getCharactersMap(),
        getMowsMap(),
      ])
      return { meta, charactersById, mowsById }
    } catch {
      return FAILED
    }
  }, [retryNonce])

  return useMemo(() => {
    if (catalog === undefined) return { status: "loading", retry }
    if (catalog === FAILED) return { status: "failed", retry }
    if (catalog.meta === null) return { status: "absent", retry }

    const meta = catalog.meta
    return {
      status: "ready",
      meta,
      retry,
      presentation: createGuildRaidMetaPresentationResolver({
        meta,
        charactersById: catalog.charactersById,
        mowsById: catalog.mowsById,
        bossName: (bossUnitSetId, fallback) =>
          t(`raidBosses:${bossUnitSetId}`, { defaultValue: fallback }),
      }),
    }
  }, [catalog, retry, t])
}

/** Backwards-compatible presentation-only access for existing consumers. */
export function useGuildRaidMetaPresentation() {
  const catalog = useGuildRaidMetaCatalog()
  return catalog.status === "ready" ? catalog.presentation : null
}

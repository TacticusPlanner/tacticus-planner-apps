import type {
  GameCatalogGuildRaidMeta,
  GuildRaidMetaStorageModel,
} from "@workspace/game-catalog"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { combineReadStates } from "@/shared/lib"
import { toById, useCatalogDataset } from "@/shared/local-data"

import { createGuildRaidMetaPresentationResolver } from "./resolve-guild-raid-meta"

// Guild Raid Meta is one curated payload; null means it has not synchronized yet.
const toMeta = (rows: GuildRaidMetaStorageModel[]) => rows[0] ?? null

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
  const metaRead = useCatalogDataset("guild-raid-meta", toMeta)
  const charactersRead = useCatalogDataset("characters", toById)
  const mowsRead = useCatalogDataset("mows", toById)
  // Each read is stable while unchanged, so the combination is too.
  const read = useMemo(
    () => combineReadStates(metaRead, charactersRead, mowsRead),
    [metaRead, charactersRead, mowsRead]
  )

  return useMemo((): GuildRaidMetaCatalog => {
    const { retry } = read
    if (read.status === "loading") return { status: "loading", retry }
    if (read.status === "error") return { status: "failed", retry }
    const [meta, charactersById, mowsById] = read.data
    if (meta === null) return { status: "absent", retry }

    return {
      status: "ready",
      meta,
      retry,
      presentation: createGuildRaidMetaPresentationResolver({
        meta,
        charactersById,
        mowsById,
        bossName: (bossUnitSetId, fallback) =>
          t(`raidBosses:${bossUnitSetId}`, { defaultValue: fallback }),
        roleLabel: (roleId, fallback) =>
          t(`dailies:guildRaids.variantRules.role.${roleId}`, {
            defaultValue: fallback,
          }),
        kindLabel: (kind, fallback) =>
          t(`dailies:guildRaids.exactMeta.kind.${kind}`, {
            defaultValue: fallback,
          }),
      }),
    }
  }, [read, t])
}

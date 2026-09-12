import { useMemo } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { raidBossPortrait } from "@workspace/game-catalog"
import { getCharactersMap } from "@workspace/game-catalog/queries"

import {
  resolvePrimeCharacterId,
  unitDisplayName,
  useRaidBossLabels,
} from "@/entities/raid-boss"

import type { GuildRaidCatalogResolver } from "./guild-raid-status-view-model"

/**
 * Name/portrait resolution for the Guild Raids status page: names come from the (catalog-independent)
 * `raidBosses` i18n namespace, portraits from the static round-portrait override map plus — when the
 * local roster catalog has loaded — the matching playable-character icon for a prime. The local roster
 * is opportunistic: while it is still loading, portraits just fall back to the initials badge instead
 * of gating the whole page on it, since HP/modifier data already came fully resolved from the API.
 */
export function useGuildRaidCatalog(): GuildRaidCatalogResolver {
  const { bossName, hasBossName } = useRaidBossLabels()
  const charactersById = useLiveQuery(() => getCharactersMap(), [])

  return useMemo<GuildRaidCatalogResolver>(
    () => ({
      resolveName: (unitSetId) =>
        bossName(unitSetId, unitDisplayName(unitSetId)),
      hasName: (unitSetId) => hasBossName(unitSetId),
      resolvePortrait: (unitSetId) =>
        raidBossPortrait(
          unitSetId,
          charactersById
            ? resolvePrimeCharacterId(unitSetId, charactersById)
            : undefined
        ),
    }),
    [bossName, hasBossName, charactersById]
  )
}

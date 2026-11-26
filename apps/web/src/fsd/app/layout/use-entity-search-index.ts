import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import {
  characterIcon,
  mowIcon,
  raidBossPortrait,
} from "@workspace/game-catalog"
import type { UnitId } from "@workspace/game-domain"

import {
  buildNpcGroups,
  npcPortraitSrc,
  portraitVariationOf,
} from "@/entities/npc"
import { unitDisplayName } from "@/entities/raid-boss"
import { useCatalogDataset } from "@/shared/local-data"

import type { SearchEntity } from "./entity-search"

// Namespaces that hold entity names, loaded on demand: the palette mounts on open, so a cold
// namespace must not suspend it. Until they arrive, names fall back to the catalog's English ones.
const NAME_NAMESPACES = [
  "characters",
  "mows",
  "npcs",
  "raidBosses",
  "unitSearchNames",
] as const

const firstRecord = <T>(records: T[]): T | null => records[0] ?? null

/**
 * Every game entity navigation search can open, built from the synced catalog: characters,
 * Machines of War, NPCs (one per name, as the NPC Library lists them), guild raid bosses and primes,
 * and, when `withLegendaryEvents`, Legendary Events. A dataset that has not synced yet adds nothing.
 */
export function useEntitySearchIndex({
  withLegendaryEvents,
}: {
  withLegendaryEvents: boolean
}): SearchEntity[] {
  const { t } = useTranslation(NAME_NAMESPACES, { useSuspense: false })
  const characters = useCatalogDataset("characters")
  const mows = useCatalogDataset("mows")
  const npcs = useCatalogDataset("npcs")
  const raidBosses = useCatalogDataset("raid-bosses", firstRecord)
  const lres = useCatalogDataset("lres")

  const characterRecords =
    characters.status === "ready" ? characters.data : undefined
  const mowRecords = mows.status === "ready" ? mows.data : undefined
  const npcRecords = npcs.status === "ready" ? npcs.data : undefined
  const bossPayload =
    raidBosses.status === "ready" ? raidBosses.data : undefined
  const lreRecords =
    withLegendaryEvents && lres.status === "ready" ? lres.data : undefined

  return useMemo(() => {
    const searchNames = (id: string): readonly string[] => {
      const names: unknown = t(`unitSearchNames:${id}`, {
        returnObjects: true,
        defaultValue: [],
      })
      return Array.isArray(names) ? (names as string[]) : []
    }
    const characterName = (id: string, fallback: string) =>
      t(`characters:${id}`, { defaultValue: fallback })
    const characterNames = new Map(
      (characterRecords ?? []).map((record) => [record.id, record.name])
    )

    const entities: SearchEntity[] = []
    for (const record of characterRecords ?? []) {
      entities.push({
        kind: "characters",
        id: record.id,
        name: characterName(record.id, record.name),
        searchNames: searchNames(record.id),
        to: `/library/characters/${record.id}`,
        iconSrc: characterIcon(record.id),
      })
    }
    for (const record of mowRecords ?? []) {
      entities.push({
        kind: "mows",
        id: record.id,
        name: t(`mows:${record.id}`, { defaultValue: record.name }),
        searchNames: searchNames(record.id),
        to: `/library/machines-of-war/${record.id}`,
        iconSrc: mowIcon(record.id),
      })
    }
    for (const group of buildNpcGroups(npcRecords ?? [])) {
      const variationId = portraitVariationOf(group)
      entities.push({
        kind: "npcs",
        id: group.id,
        name: t(`npcs:${group.defaultVariationId}`, {
          defaultValue: group.name,
        }),
        searchNames: [],
        to: `/library/npcs/${group.id}`,
        iconSrc: npcPortraitSrc(variationId, group.characterId),
      })
    }
    for (const unit of [
      ...(bossPayload?.bosses ?? []),
      ...(bossPayload?.primes ?? []),
    ]) {
      entities.push({
        kind: "raidBosses",
        id: unit.unitSetId,
        name: t(`raidBosses:${unit.unitSetId}`, {
          defaultValue: unitDisplayName(unit.unitSetId),
        }),
        searchNames: [],
        to: `/library/raid-bosses/${unit.unitSetId}`,
        iconSrc: raidBossPortrait(unit.unitSetId),
      })
    }
    for (const record of lreRecords ?? []) {
      entities.push({
        kind: "legendaryEvents",
        id: record.id,
        // An LE is named after its legendary character.
        name: characterName(
          record.id,
          characterNames.get(record.id as UnitId) ?? record.name
        ),
        searchNames: searchNames(record.id),
        to: `/legendary-events/${record.id}`,
        iconSrc: characterIcon(record.id as UnitId),
      })
    }
    return entities
  }, [t, characterRecords, mowRecords, npcRecords, bossPayload, lreRecords])
}

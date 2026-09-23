import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { npcPortrait } from "@workspace/game-catalog"
import type { FactionGroup, FactionId, UnitId } from "@workspace/game-domain"

import { UnitCombobox } from "@/shared/ui"

import { NpcDetail } from "../npc-detail"
import { NpcsFilterPanel } from "../npcs-filter-panel"
import type { NpcsPageViewProps } from "../npcs-page.view-model"

export function NpcsMobilePage(props: NpcsPageViewProps) {
  const {
    items,
    filters,
    filterOptions,
    activeFilterCount,
    onFiltersChange,
    onClearFilters,
    selectedId,
    onSelect,
  } = props
  const { t } = useTranslation("library")

  // The shared unit combobox is generic over {id, name} members grouped by faction; NPC group slugs
  // stand in for unit ids, and the portrait resolves through the group's default variation.
  const groups = useMemo<FactionGroup[]>(() => {
    const byFaction = new Map<string, FactionGroup>()
    for (const item of items) {
      let group = byFaction.get(item.factionId)
      if (!group) {
        group = {
          factionId: item.factionId as FactionId,
          factionName: item.factionName,
          members: [],
        }
        byFaction.set(item.factionId, group)
      }
      group.members.push({ id: item.id as UnitId, name: item.name })
    }
    return [...byFaction.values()]
  }, [items])
  const portraitById = useMemo(
    () => new Map(items.map((item) => [item.id, item.portraitVariationId])),
    [items]
  )
  const icon = useCallback(
    (id: UnitId) => {
      const variationId = portraitById.get(id)
      return variationId ? npcPortrait(variationId) : undefined
    },
    [portraitById]
  )

  return (
    <div className="flex flex-col gap-4" data-testid="npcs-mobile-page">
      <div className="flex flex-col gap-2" data-testid="npcs-combobox">
        <UnitCombobox
          groups={groups}
          value={selectedId as UnitId | undefined}
          onChange={(id) => onSelect(id)}
          placeholder={t("npcs.selectNpc")}
          emptyText={t("npcs.noMatchingNpcs")}
          icon={icon}
        />
        <NpcsFilterPanel
          filters={filters}
          options={filterOptions}
          activeCount={activeFilterCount}
          onChange={onFiltersChange}
          onClear={onClearFilters}
        />
        {items.length === 0 ? (
          <p
            className="py-4 text-center text-sm text-muted-foreground"
            data-testid="npcs-no-matching"
          >
            {t("npcs.noMatchingNpcs")}
          </p>
        ) : null}
      </div>
      <div className="rounded-lg border p-4">
        <NpcDetail {...props} compact />
      </div>
    </div>
  )
}

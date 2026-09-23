import type {
  NpcFilters,
  NpcGroup,
  NpcLevelOption,
  NpcVariation,
  NpcVariationMode,
} from "@/entities/npc"

/** One NPC as listed in the desktop tile grid / mobile picker. */
export interface NpcListItem {
  id: string
  name: string
  factionId: string
  factionName: string
  /** The variation whose portrait represents the group (its default). */
  portraitVariationId: string
}

/** One Variation selector option for the selected NPC. */
export interface NpcVariationOption {
  id: string
  mode: NpcVariationMode
  /** Localized mode label; the raw id is shown as secondary text. */
  label: string
}

/** Filter options derived from the listed catalog (so the controls only offer values that exist). */
export interface NpcFilterOptions {
  factions: { id: string; name: string }[]
  alliances: { id: string; name: string }[]
  damageTypes: { id: string; name: string }[]
  traits: { id: string; name: string }[]
}

/** Flat props for the desktop and mobile sub-pages; the orchestrator computes them once. */
export interface NpcsPageViewProps {
  items: NpcListItem[]
  filters: NpcFilters
  filterOptions: NpcFilterOptions
  activeFilterCount: number
  onFiltersChange: (filters: NpcFilters) => void
  onClearFilters: () => void

  selectedGroup: NpcGroup | undefined
  selectedName: string
  selectedId: string | undefined
  onSelect: (groupId: string) => void

  /** Variations of the selected group that pass the active filters. */
  variationOptions: NpcVariationOption[]
  selectedVariation: NpcVariation | undefined
  onVariationChange: (variationId: string) => void

  levels: NpcLevelOption[]
  selectedLevel: NpcLevelOption | undefined
  onLevelChange: (servedIndex: number) => void
}

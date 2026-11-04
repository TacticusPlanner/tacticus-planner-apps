import type {
  EventsCalendarStorageModel,
  NpcEncounterSource,
} from "@workspace/game-catalog"

import type {
  EncounterPlaceIndex,
  NpcEncounter,
  NpcFilters,
  NpcGroup,
  NpcLevelOption,
  NpcStatRow,
  NpcVariation,
  NpcVariationMode,
} from "@/entities/npc"
import type { ReadState } from "@/shared/lib"
import { npcPowerAt, type UnitPowerContext } from "@/shared/unit-power"

import { powerFigure, type PowerFigure } from "../unit/unit-power.model"

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
  /** The encounter sources some listed variation has, in display order; empty without encounter data. */
  gameModes: { id: NpcEncounterSource; name: string }[]
  /** The groups of the chosen game mode, by name; empty until one is chosen. */
  locations: { id: string; name: string }[]
  /** Whether "running now" can be answered: both the encounter data and the calendar are present. */
  canFilterRunning: boolean
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
  /** The selected variation's power at the selected level row (an estimate). */
  power: PowerFigure

  /** Where the selected variation is encountered, ordered by source; see `encountersStatus`. */
  encounters: NpcEncounter[]
  /** The NPCs at each encounter location, for the rows' expanded battle lists. */
  encounterPlaces: EncounterPlaceIndex
  /** The places meeting the mission count of the filters, or `null` while none is set. */
  matchingPlaces: ((encounter: NpcEncounter) => ReadonlySet<string>) | null
  /** Called as a battle chip opens a variation, which the filters may exclude. */
  onOpenBattleVariation: (variationId: string) => void
  /** The `npc-encounters` data state: `present` makes `encounters` meaningful (empty = none recorded). */
  encountersStatus: "loading" | "absent" | "failed" | "present"
  /** The stored calendar rows for encounter timing, or `null` while the calendar is not available. */
  calendar: readonly EventsCalendarStorageModel[] | null
}

/** The estimated power of an NPC variation at one of its level rows. */
export function npcPowerFigure(
  variationId: string | undefined,
  row: NpcStatRow | undefined,
  context: ReadState<UnitPowerContext | null>
): PowerFigure {
  if (!variationId || !row) return { status: "unavailable" }
  return powerFigure(context, (ready) => npcPowerAt(variationId, row, ready))
}

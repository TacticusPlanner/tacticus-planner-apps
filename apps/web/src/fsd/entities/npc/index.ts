export type {
  NpcAttackFilter,
  NpcFilters,
  NpcGroup,
  NpcLevelOption,
  NpcRecord,
  NpcStatRow,
  NpcVariation,
} from "./model/types"
export {
  buildNpcGroups,
  defaultVariationId,
  isVariationAvailable,
} from "./lib/build-npc-groups"
export { npcSlug } from "./lib/npc-slug"
export { rarityFromStars } from "./lib/rarity-from-stars"
export { orderLevels } from "./lib/order-levels"
export {
  activeNpcFilterCount,
  emptyNpcFilters,
  filterNpcGroups,
  hasActiveNpcFilters,
  matchesNpcFilters,
  matchesNpcSearch,
  matchingVariations,
  variationDamageTypes,
} from "./lib/npc-filters"
export {
  variationMode,
  variationModeLabelKey,
  type NpcVariationMode,
} from "./lib/variation-mode"
export { useNpcLabels } from "./lib/use-npc-labels"
export {
  useAbilityText as useNpcAbilityText,
  useTraitText as useNpcTraitText,
  type AbilityTextEntry as NpcAbilityTextEntry,
  type TraitTextEntry as NpcTraitTextEntry,
} from "@/shared/ability-text"
export { NpcPortrait } from "./ui/npc-portrait"
export { NpcLevelBadge } from "./ui/npc-level-badge"
export { NpcStatSummary } from "./ui/npc-stat-summary"
export {
  resolveLadderRow,
  type ResolvedLadderRow,
} from "./lib/resolve-ladder-row"
export { npcLibraryHref } from "./lib/library-href"
export { useNpcsById, type NpcsByIdState } from "./model/use-npcs-by-id"

import {
  campaignIcon,
  factionIcon,
  gameMenuIcon,
  heroStarIcon,
  onslaughtAllianceIcon,
  rankIcon,
  rarityIcon,
  shardIcon,
  statIcon,
  traitIcon,
} from "@workspace/game-catalog"
import type { GameIcon } from "@workspace/game-catalog"
import { campaignIdSchema } from "@workspace/game-domain"

import { EntityIcon } from "./entity-icon"

/**
 * The game art that stands for each kind of filter, so a panel of filters reads at a glance rather
 * than as a wall of grey inputs (ui-style-guide rule 3). A kind of entity the game has one icon for
 * (a stat, stars, shards) shows that icon; a set of entities with no icon of its own (alliances,
 * factions, traits) shows three of its members, overlapping. Every panel takes its icon from here, so
 * one filter looks the same on every page.
 */
const FILTER_LABEL_ICONS = {
  alliance: [
    onslaughtAllianceIcon("Imperial"),
    onslaughtAllianceIcon("Xenos"),
    onslaughtAllianceIcon("Chaos"),
  ],
  faction: [
    factionIcon("Ultramarines"),
    factionIcon("Aeldari"),
    factionIcon("BlackLegion"),
  ],
  rarity: [rarityIcon("Legendary")],
  rank: [rankIcon("Gold1")],
  stars: [heroStarIcon()],
  unitType: [gameMenuIcon("heroes")],
  attackType: [statIcon("melee")],
  hits: [statIcon("hits")],
  movement: [statIcon("movement")],
  attackRange: [statIcon("ranged")],
  damageType: [statIcon("damage")],
  trait: [traitIcon("Flying"), traitIcon("Psyker"), traitIcon("Mechanical")],
  shardSource: [shardIcon("Regular")],
  campaignType: [campaignIcon(campaignIdSchema.parse("campaign1"), "Standard")],
} satisfies Record<string, (GameIcon | undefined)[]>

export type FilterLabelIconKind = keyof typeof FILTER_LABEL_ICONS

/** The icon before a filter's label: decorative, as the label beside it already names it. */
export function FilterLabelIcon({ kind }: { kind: FilterLabelIconKind }) {
  const icons: readonly (GameIcon | undefined)[] = FILTER_LABEL_ICONS[kind]
  return (
    <span aria-hidden="true" className="flex shrink-0 items-center -space-x-1">
      {icons.map((icon, index) => (
        <EntityIcon alt="" key={index} size="inline" src={icon} />
      ))}
    </span>
  )
}

import {
  battleGlyphIcon,
  campaignIcon,
  countdownIcon,
  equipmentSlotIcon,
  factionIcon,
  gameMenuIcon,
  datamineAssetUrl,
  heroStarIcon,
  onslaughtAllianceIcon,
  rankIcon,
  rarityIcon,
  shardIcon,
  statIcon,
  traitIcon,
  UpgradeIcons,
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
  summons: [battleGlyphIcon("summon")],
  abilityRole: [battleGlyphIcon("abilityUse")],
  abilityTarget: [battleGlyphIcon("kill")],
  abilityAttack: [statIcon("ranged")],
  hits: [statIcon("hits")],
  movement: [statIcon("movement")],
  attackRange: [statIcon("ranged")],
  damageType: [statIcon("damage")],
  trait: [traitIcon("Flying"), traitIcon("Psyker"), traitIcon("Mechanical")],
  shardSource: [shardIcon("Regular")],
  enemies: [battleGlyphIcon("kill")],
  // The game's hero count (a squad of figures): how many units a battle lets you deploy.
  deploymentSlots: [datamineAssetUrl("atlases/ui_icon_herocount.webp")],
  gameMode: [gameMenuIcon("battle")],
  runningNow: [countdownIcon()],
  campaignType: [campaignIcon(campaignIdSchema.parse("campaign1"), "Standard")],
  upgradeStat: [statIcon("health"), statIcon("damage"), statIcon("armour")],
  upgradeKind: [UpgradeIcons.craftedBadge],
  itemSlot: [
    equipmentSlotIcon("I_Crit"),
    equipmentSlotIcon("I_Block"),
    equipmentSlotIcon("I_Defensive"),
  ],
} satisfies Record<string, (GameIcon | undefined)[]>

export type FilterLabelIconKind = keyof typeof FILTER_LABEL_ICONS

/** The icon before a filter's label: decorative, as the label beside it already names it. */
export function FilterLabelIcon({ kind }: { kind: FilterLabelIconKind }) {
  const icons: readonly (GameIcon | undefined)[] = FILTER_LABEL_ICONS[kind]
  return (
    <span aria-hidden="true" className="flex shrink-0 items-center -space-x-1">
      {icons.map((icon, index) => (
        <EntityIcon alt="" key={index} size="icon" src={icon} />
      ))}
    </span>
  )
}

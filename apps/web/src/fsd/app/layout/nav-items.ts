import type { LucideIcon } from "lucide-react"
import {
  CalendarCheck,
  CalendarDays,
  CalendarRange,
  BookOpen,
  Folders,
  Gamepad2,
  History,
  Home,
  LayoutGrid,
  ListOrdered,
  ListTodo,
  Settings,
  Table2,
  Users,
} from "lucide-react"

import {
  eventIcon,
  gameMenuIcon,
  gameModeTokenIcon,
} from "@workspace/game-catalog"

import { isUiKitEnabled } from "@/shared/config"
import type { FeatureFlag } from "@/shared/feature-flags"

type NavLabelKey =
  | "nav.home"
  | "nav.goals"
  | "nav.myGame"
  | "nav.legendaryEvents"
  | "nav.uiKit"
  | "nav.guild"
  | "nav.dailies"
  | "library:section.label"
  | "library:collections.characters.label"
  | "library:collections.machinesOfWar.label"
  | "library:collections.npcs.label"
  | "library:collections.raidBosses.label"
  | "library:collections.shops.label"
  | "goals.tabs.overview"
  | "goals.tabs.projects"
  | "goals.tabs.insights"
  | "goals.tabs.schedule"
  | "goals.tabs.survival"
  | "myGame.tabs.collection"
  // The game's own name for its Inventory screen (generated `gameUi` namespace, preloaded).
  | "gameUi:inventory.title"
  // The game's own name for its Items screen (generated `gameUi` namespace, preloaded).
  | "gameUi:items.title"
  | "myGame.tabs.onslaught"
  | "myGame.tabs.campaigns"
  | "myGame.tabs.campaign-events"
  | "myGame.tabs.incursions"
  | "myGame.tabs.teams"
  | "legendaryEvents.tabs.allEvents"
  | "legendaryEvents.tabs.masterTable"
  | "legendaryEvents.tabs.tierList"
  | "guild.tabs.members"
  | "guild.tabs.settings"
  | "guild.tabs.warOffense"
  | "guild.tabs.warHistory"
  // Namespace-prefixed ("dailies:...") rather than living in `common.json` like every other
  // section's tab keys: `dailies` is its own long-standing i18n namespace/file, and duplicating
  // its content into `common.json` is an explicitly disallowed regression (see
  // `dailies-translations.test.ts`). `dailies` is preloaded in `i18n.ts` alongside `common` so
  // these resolve correctly in the always-mounted app shell, not just once a Dailies page has
  // been visited.
  | "dailies:tabs.raids"
  | "dailies:tabs.hse"
  | "dailies:tabs.hre"
  | "dailies:tabs.quest"
  | "dailies:tabs.eventShop"
  | "dailies:tabs.guild-raids"

// Follows the sibling-leaf naming convention: a description key is always the matching label key
// with "Description" appended, keeping descriptions co-located with their labels in each locale
// file (e.g. `nav.home` -> `nav.homeDescription`).
type NavDescriptionKey =
  | `${Exclude<
      NavLabelKey,
      | "library:section.label"
      | "library:collections.characters.label"
      | "library:collections.machinesOfWar.label"
      | "library:collections.npcs.label"
      | "library:collections.raidBosses.label"
      | "library:collections.shops.label"
      | "gameUi:inventory.title"
      | "gameUi:items.title"
    >}Description`
  | "myGame.tabs.inventoryDescription"
  | "myGame.tabs.itemsDescription"
  | "library:section.description"
  | "library:collections.characters.description"
  | "library:collections.machinesOfWar.description"
  | "library:collections.npcs.description"
  | "library:collections.raidBosses.description"
  | "library:collections.shops.description"

/** The label of a group of a section's children (see `NavSubItemBase.groupLabelKey`). */
export type NavGroupLabelKey = "guild.groups.guild" | "guild.groups.guildWar"

export type NavTranslate = (
  key: NavLabelKey | NavDescriptionKey | NavGroupLabelKey
) => string

interface NavSubItemBase {
  path: string
  // This child's own path renders a screen a user can land on, so its header tab returns there from
  // a route nested below it (see `section-tabs.tsx`). Opt-in, because for most children the path is
  // not a destination: `use-library-route-selection` canonicalizes a Library collection path,
  // `replace`-ing it with `<collection>/<firstId>`. Navigating to it throws the user somewhere
  // they did not ask for, so a child added later must declare this deliberately rather than
  // inherit it.
  isLandingPage?: boolean
  // Names a live signal this entry shows through `NavLiveDot` (absent means none).
  liveIndicator?: "hse" | "hre" | "quest"
  // Extra navigation-search terms beyond the label and description: the shorthand players type
  // (GW, LRE, MoW…). Lowercase; not translated, like the quick actions' keywords.
  keywords?: readonly string[]
  // Overrides the section's `anonymousAllowed` for this child, so one section can mix public and
  // sign-in-only pages (My Game: Collection is public, the rest are not). Absent means inherit.
  // It can only narrow: `filterVisibleNavItems` drops a sign-in-only section before looking at its
  // children, so `true` under such a section does nothing.
  anonymousAllowed?: boolean
  // Hides this child until the named feature flag is on (resolved by `use-nav-items.ts`).
  featureFlag?: FeatureFlag
  // Names the group this child belongs to: the section menu and drawer label each group above its
  // first child, and the page tabs list only the active child's group (see `nav-groups.ts`). The
  // children of one group are listed together. Absent on every child means an ungrouped section.
  groupLabelKey?: NavGroupLabelKey
}

/** A static child, labelled through i18n keys like its section, with an optional icon: the game's
 *  own art for the screen it opens (`artSrc`), else a lucide glyph. */
interface StaticNavSubItem extends NavSubItemBase {
  labelKey: NavLabelKey
  descriptionKey: NavDescriptionKey
  icon?: LucideIcon
  artSrc?: string
}

/** A child resolved from data by `use-nav-items.ts` (design D1): already-localized text and an
 *  optional portrait rendered before the label. */
export interface DynamicNavSubItem extends NavSubItemBase {
  label: string
  description: string
  iconSrc?: string
}

export type NavSubItem = StaticNavSubItem | DynamicNavSubItem

export function subItemLabel(t: NavTranslate, child: NavSubItem): string {
  return "labelKey" in child ? t(child.labelKey) : child.label
}

export function subItemDescription(t: NavTranslate, child: NavSubItem): string {
  return "descriptionKey" in child ? t(child.descriptionKey) : child.description
}

export interface NavItem {
  path: string
  labelKey: NavLabelKey
  descriptionKey: NavDescriptionKey
  icon: LucideIcon
  /** The game's own art for the section, shown in place of `icon` in the navigation menu. */
  artSrc?: string
  anonymousAllowed: boolean
  /** See `NavSubItemBase.keywords`. */
  keywords?: readonly string[]
  children?: NavSubItem[]
  // Names a resolver `use-nav-items.ts` runs to prepend data-driven children (the active Legendary
  // Events) to the static `children` above. A key rather than a function so this module stays a
  // plain data module.
  dynamicChildren?: "legendaryEvents"
  // Where this item surfaces on mobile: a direct bottom-nav destination, or
  // tucked inside the bottom-left hamburger menu. Desktop ignores this and
  // always lists every visible item in the sidebar's main nav.
  mobilePlacement: "primary" | "menu"
  // See `NavSubItem.liveIndicator`; the parent shows it too so it stays visible when collapsed.
  // "events" is live while either the HSE or the HRE signal is.
  liveIndicator?: "hse" | "hre" | "quest" | "events"
}

export const navItems: NavItem[] = [
  {
    path: "/home",
    keywords: ["dashboard", "overview"],
    labelKey: "nav.home",
    descriptionKey: "nav.homeDescription",
    icon: Home,
    artSrc: gameMenuIcon("home"),
    anonymousAllowed: false,
    mobilePlacement: "primary",
  },
  {
    path: "/my-game",
    keywords: ["roster"],
    labelKey: "nav.myGame",
    descriptionKey: "nav.myGameDescription",
    icon: Gamepad2,
    artSrc: gameMenuIcon("heroes"),
    // Visible to everyone for its public Collection child; the other children require sign-in
    // and are filtered out for anonymous users (see filterVisibleNavItems).
    anonymousAllowed: true,
    mobilePlacement: "menu",
    children: [
      {
        path: "/my-game/collection",
        keywords: ["roster", "units", "heroes", "characters", "mow"],
        artSrc: gameMenuIcon("heroes"),
        labelKey: "myGame.tabs.collection",
        descriptionKey: "myGame.tabs.collectionDescription",
      },
      {
        path: "/my-game/inventory",
        keywords: ["resources", "materials", "upgrades", "xp books", "orbs"],
        artSrc: gameMenuIcon("inventory"),
        labelKey: "gameUi:inventory.title",
        descriptionKey: "myGame.tabs.inventoryDescription",
        anonymousAllowed: false,
      },
      {
        path: "/my-game/items",
        keywords: ["equipment", "gear", "relics", "salvage", "reclaim"],
        artSrc: gameMenuIcon("forge"),
        labelKey: "gameUi:items.title",
        descriptionKey: "myGame.tabs.itemsDescription",
        anonymousAllowed: false,
      },
      {
        path: "/my-game/onslaught",
        artSrc: gameMenuIcon("onslaught"),
        labelKey: "myGame.tabs.onslaught",
        descriptionKey: "myGame.tabs.onslaughtDescription",
        anonymousAllowed: false,
      },
      {
        path: "/my-game/campaigns",
        keywords: ["campaign", "nodes"],
        artSrc: gameMenuIcon("battle"),
        labelKey: "myGame.tabs.campaigns",
        descriptionKey: "myGame.tabs.campaignsDescription",
        anonymousAllowed: false,
      },
      {
        path: "/my-game/campaign-events",
        keywords: ["ce"],
        artSrc: gameMenuIcon("campaignEvent"),
        labelKey: "myGame.tabs.campaign-events",
        descriptionKey: "myGame.tabs.campaign-eventsDescription",
        anonymousAllowed: false,
      },
      {
        path: "/my-game/incursions",
        keywords: ["mow", "machines of war"],
        artSrc: eventIcon("incursion", "Incursion"),
        labelKey: "myGame.tabs.incursions",
        descriptionKey: "myGame.tabs.incursionsDescription",
        anonymousAllowed: false,
      },
      {
        path: "/my-game/teams",
        keywords: ["lineups", "ta", "tournament arena"],
        artSrc: gameMenuIcon("guildWar"),
        labelKey: "myGame.tabs.teams",
        descriptionKey: "myGame.tabs.teamsDescription",
        anonymousAllowed: false,
      },
    ],
  },
  {
    path: "/plan",
    keywords: ["goals"],
    labelKey: "nav.goals",
    descriptionKey: "nav.goalsDescription",
    icon: ListTodo,
    artSrc: gameMenuIcon("achievements"),
    anonymousAllowed: false,
    mobilePlacement: "primary",
    children: [
      {
        path: "/plan/goals",
        keywords: ["targets"],
        artSrc: gameMenuIcon("achievements"),
        labelKey: "goals.tabs.overview",
        descriptionKey: "goals.tabs.overviewDescription",
      },
      {
        path: "/plan/projects",
        icon: Folders,
        labelKey: "goals.tabs.projects",
        descriptionKey: "goals.tabs.projectsDescription",
      },
      {
        path: "/plan/insights",
        keywords: ["materials", "mats", "upgrades"],
        artSrc: gameMenuIcon("forge"),
        labelKey: "goals.tabs.insights",
        descriptionKey: "goals.tabs.insightsDescription",
      },
      {
        path: "/plan/schedule",
        keywords: ["calendar"],
        icon: CalendarRange,
        labelKey: "goals.tabs.schedule",
        descriptionKey: "goals.tabs.scheduleDescription",
      },
      {
        path: "/plan/event-shop",
        keywords: ["shop"],
        artSrc: gameMenuIcon("shop"),
        labelKey: "dailies:tabs.eventShop",
        descriptionKey: "dailies:tabs.eventShopDescription",
      },
      {
        path: "/plan/survival",
        artSrc: gameModeTokenIcon("survival"),
        labelKey: "goals.tabs.survival",
        descriptionKey: "goals.tabs.survivalDescription",
      },
    ],
  },
  {
    path: "/dailies",
    labelKey: "nav.dailies",
    descriptionKey: "nav.dailiesDescription",
    icon: CalendarCheck,
    artSrc: gameMenuIcon("dailyMissions"),
    anonymousAllowed: false,
    mobilePlacement: "primary",
    liveIndicator: "events",
    children: [
      {
        path: "/dailies/raids",
        keywords: ["energy", "farming"],
        artSrc: gameMenuIcon("raids"),
        labelKey: "dailies:tabs.raids",
        descriptionKey: "dailies:tabs.raidsDescription",
      },
      {
        path: "/dailies/hse",
        keywords: ["home screen event"],
        artSrc: gameMenuIcon("homeScreenEvent"),
        labelKey: "dailies:tabs.hse",
        descriptionKey: "dailies:tabs.hseDescription",
        liveIndicator: "hse",
      },
      {
        path: "/dailies/hre",
        keywords: ["hero release event"],
        artSrc: gameMenuIcon("heroReleaseEvent"),
        labelKey: "dailies:tabs.hre",
        descriptionKey: "dailies:tabs.hreDescription",
        liveIndicator: "hre",
      },
      {
        path: "/dailies/quest",
        keywords: ["quests", "mythic"],
        artSrc: gameMenuIcon("quests"),
        labelKey: "dailies:tabs.quest",
        descriptionKey: "dailies:tabs.questDescription",
        liveIndicator: "quest",
      },
      {
        path: "/dailies/guild-raids",
        keywords: ["gr", "guild raid", "boss"],
        artSrc: gameMenuIcon("guildRaid"),
        labelKey: "dailies:tabs.guild-raids",
        descriptionKey: "dailies:tabs.guild-raidsDescription",
      },
    ],
  },
  {
    path: "/legendary-events",
    keywords: ["le", "lre"],
    labelKey: "nav.legendaryEvents",
    descriptionKey: "nav.legendaryEventsDescription",
    icon: CalendarDays,
    artSrc: gameMenuIcon("legendaryEvent"),
    anonymousAllowed: false,
    mobilePlacement: "menu",
    // The static children come first, then every catalog event (see use-nav-items.ts).
    dynamicChildren: "legendaryEvents",
    children: [
      {
        path: "/legendary-events",
        keywords: ["le", "lre"],
        labelKey: "legendaryEvents.tabs.allEvents",
        artSrc: gameMenuIcon("legendaryEvent"),
        descriptionKey: "legendaryEvents.tabs.allEventsDescription",
        // The hub is a destination of its own; archived and upcoming event pages nest below it.
        isLandingPage: true,
      },
      {
        path: "/legendary-events/master-table",
        keywords: ["le", "lre"],
        labelKey: "legendaryEvents.tabs.masterTable",
        descriptionKey: "legendaryEvents.tabs.masterTableDescription",
        icon: Table2,
      },
      {
        path: "/legendary-events/tier-list",
        keywords: ["le", "lre", "tiers"],
        labelKey: "legendaryEvents.tabs.tierList",
        descriptionKey: "legendaryEvents.tabs.tierListDescription",
        icon: ListOrdered,
      },
    ],
  },
  {
    path: "/guild",
    labelKey: "nav.guild",
    descriptionKey: "nav.guildDescription",
    icon: Users,
    artSrc: gameMenuIcon("guild"),
    anonymousAllowed: false,
    mobilePlacement: "primary",
    children: [
      {
        path: "/guild/members",
        keywords: ["roster"],
        artSrc: gameMenuIcon("guild"),
        labelKey: "guild.tabs.members",
        descriptionKey: "guild.tabs.membersDescription",
        groupLabelKey: "guild.groups.guild",
      },
      {
        path: "/guild/settings",
        keywords: ["api key"],
        icon: Settings,
        labelKey: "guild.tabs.settings",
        descriptionKey: "guild.tabs.settingsDescription",
        groupLabelKey: "guild.groups.guild",
      },
      {
        path: "/guild/war/offense",
        keywords: ["gw", "guild war", "attack"],
        artSrc: gameMenuIcon("guildWar"),
        labelKey: "guild.tabs.warOffense",
        descriptionKey: "guild.tabs.warOffenseDescription",
        groupLabelKey: "guild.groups.guildWar",
      },
      {
        path: "/guild/war/history",
        keywords: ["gw", "guild war"],
        icon: History,
        labelKey: "guild.tabs.warHistory",
        descriptionKey: "guild.tabs.warHistoryDescription",
        groupLabelKey: "guild.groups.guildWar",
      },
    ],
  },
  {
    path: "/library",
    labelKey: "library:section.label",
    descriptionKey: "library:section.description",
    icon: BookOpen,
    artSrc: gameMenuIcon("inventory"),
    anonymousAllowed: true,
    mobilePlacement: "menu",
    children: [
      {
        path: "/library/characters",
        keywords: ["heroes", "units"],
        artSrc: gameMenuIcon("heroes"),
        labelKey: "library:collections.characters.label",
        descriptionKey: "library:collections.characters.description",
      },
      {
        path: "/library/machines-of-war",
        keywords: ["mow"],
        artSrc: gameMenuIcon("machinesOfWar"),
        labelKey: "library:collections.machinesOfWar.label",
        descriptionKey: "library:collections.machinesOfWar.description",
      },
      {
        path: "/library/npcs",
        keywords: ["enemies"],
        artSrc: gameMenuIcon("miniboss"),
        labelKey: "library:collections.npcs.label",
        descriptionKey: "library:collections.npcs.description",
      },
      {
        path: "/library/raid-bosses",
        keywords: ["gr", "guild raid", "boss"],
        artSrc: gameMenuIcon("guildRaid"),
        labelKey: "library:collections.raidBosses.label",
        descriptionKey: "library:collections.raidBosses.description",
        // Unlike its sibling collections, this one renders its own picker with no entity selected -
        // it redirects only when an `entityId` names a boss the catalog does not have.
        isLandingPage: true,
      },
      {
        path: "/library/shops",
        keywords: ["daily shop"],
        artSrc: gameMenuIcon("shop"),
        labelKey: "library:collections.shops.label",
        descriptionKey: "library:collections.shops.description",
      },
    ],
  },
  // The showcase route only registers with the router in non-production builds (see
  // shared/config's isUiKitEnabled) - mirror that here so it never appears in nav either.
  ...(isUiKitEnabled
    ? [
        {
          path: "/ui-kit",
          labelKey: "nav.uiKit" as const,
          descriptionKey: "nav.uiKitDescription" as const,
          icon: LayoutGrid,
          anonymousAllowed: true,
          mobilePlacement: "menu" as const,
        },
      ]
    : []),
]

/**
 * The navigation tree a user may see: sections they may open, each with only the children they
 * may open (a child inherits its section's `anonymousAllowed` unless it sets its own). A section
 * left with no visible children is dropped, so it never renders as an empty menu. Every nav
 * surface (sidebar, section menu, mobile tabs and drawer, search, entry-path resolution) consumes
 * this one filtered tree.
 */
export function filterVisibleNavItems(
  items: NavItem[],
  isAuthenticated: boolean
): NavItem[] {
  if (isAuthenticated) return items
  return items.flatMap((item) => {
    if (!item.anonymousAllowed) return []
    if (!item.children) return [item]
    const children = item.children.filter(
      (child) => child.anonymousAllowed ?? item.anonymousAllowed
    )
    if (children.length === 0) return []
    return children.length === item.children.length
      ? [item]
      : [{ ...item, children }]
  })
}

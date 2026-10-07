import type { LucideIcon } from "lucide-react"
import {
  CalendarCheck,
  CalendarDays,
  BookOpen,
  Home,
  LayoutGrid,
  ListTodo,
  TrendingUp,
  Users,
} from "lucide-react"

import { isUiKitEnabled } from "@/shared/config"

type NavLabelKey =
  | "nav.home"
  | "nav.goals"
  | "nav.progress"
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
  | "progress.tabs.onslaught"
  | "progress.tabs.campaigns"
  | "progress.tabs.campaign-events"
  | "legendaryEvents.tabs.allEvents"
  | "guild.tabs.members"
  // Namespace-prefixed ("dailies:...") rather than living in `common.json` like every other
  // section's tab keys: `dailies` is its own long-standing i18n namespace/file, and duplicating
  // its content into `common.json` is an explicitly disallowed regression (see
  // `dailies-translations.test.ts`). `dailies` is preloaded in `i18n.ts` alongside `common` so
  // these resolve correctly in the always-mounted app shell, not just once a Dailies page has
  // been visited.
  | "dailies:tabs.raids"
  | "dailies:tabs.hse"
  | "dailies:tabs.shops"
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
    >}Description`
  | "library:section.description"
  | "library:collections.characters.description"
  | "library:collections.machinesOfWar.description"
  | "library:collections.npcs.description"
  | "library:collections.raidBosses.description"
  | "library:collections.shops.description"

export type NavTranslate = (key: NavLabelKey | NavDescriptionKey) => string

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
  liveIndicator?: "hse"
}

/** A static child, labelled through i18n keys like its section. */
interface StaticNavSubItem extends NavSubItemBase {
  labelKey: NavLabelKey
  descriptionKey: NavDescriptionKey
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
  anonymousAllowed: boolean
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
  liveIndicator?: "hse"
}

export const navItems: NavItem[] = [
  {
    path: "/home",
    labelKey: "nav.home",
    descriptionKey: "nav.homeDescription",
    icon: Home,
    anonymousAllowed: false,
    mobilePlacement: "primary",
  },
  {
    path: "/library",
    labelKey: "library:section.label",
    descriptionKey: "library:section.description",
    icon: BookOpen,
    anonymousAllowed: true,
    mobilePlacement: "menu",
    children: [
      {
        path: "/library/characters",
        labelKey: "library:collections.characters.label",
        descriptionKey: "library:collections.characters.description",
      },
      {
        path: "/library/machines-of-war",
        labelKey: "library:collections.machinesOfWar.label",
        descriptionKey: "library:collections.machinesOfWar.description",
      },
      {
        path: "/library/npcs",
        labelKey: "library:collections.npcs.label",
        descriptionKey: "library:collections.npcs.description",
      },
      {
        path: "/library/raid-bosses",
        labelKey: "library:collections.raidBosses.label",
        descriptionKey: "library:collections.raidBosses.description",
        // Unlike its sibling collections, this one renders its own picker with no entity selected -
        // it redirects only when an `entityId` names a boss the catalog does not have.
        isLandingPage: true,
      },
      {
        path: "/library/shops",
        labelKey: "library:collections.shops.label",
        descriptionKey: "library:collections.shops.description",
      },
    ],
  },
  {
    path: "/plan",
    labelKey: "nav.goals",
    descriptionKey: "nav.goalsDescription",
    icon: ListTodo,
    anonymousAllowed: false,
    mobilePlacement: "primary",
    children: [
      {
        path: "/plan/goals",
        labelKey: "goals.tabs.overview",
        descriptionKey: "goals.tabs.overviewDescription",
      },
      {
        path: "/plan/projects",
        labelKey: "goals.tabs.projects",
        descriptionKey: "goals.tabs.projectsDescription",
      },
      {
        path: "/plan/insights",
        labelKey: "goals.tabs.insights",
        descriptionKey: "goals.tabs.insightsDescription",
      },
      {
        path: "/plan/schedule",
        labelKey: "goals.tabs.schedule",
        descriptionKey: "goals.tabs.scheduleDescription",
      },
    ],
  },
  {
    path: "/dailies",
    labelKey: "nav.dailies",
    descriptionKey: "nav.dailiesDescription",
    icon: CalendarCheck,
    anonymousAllowed: false,
    mobilePlacement: "primary",
    liveIndicator: "hse",
    children: [
      {
        path: "/dailies/raids",
        labelKey: "dailies:tabs.raids",
        descriptionKey: "dailies:tabs.raidsDescription",
      },
      {
        path: "/dailies/hse",
        labelKey: "dailies:tabs.hse",
        descriptionKey: "dailies:tabs.hseDescription",
        liveIndicator: "hse",
      },
      {
        path: "/dailies/shops",
        labelKey: "dailies:tabs.shops",
        descriptionKey: "dailies:tabs.shopsDescription",
      },
      {
        path: "/dailies/guild-raids",
        labelKey: "dailies:tabs.guild-raids",
        descriptionKey: "dailies:tabs.guild-raidsDescription",
      },
    ],
  },
  {
    path: "/progress",
    labelKey: "nav.progress",
    descriptionKey: "nav.progressDescription",
    icon: TrendingUp,
    anonymousAllowed: false,
    mobilePlacement: "menu",
    children: [
      {
        path: "/progress/onslaught",
        labelKey: "progress.tabs.onslaught",
        descriptionKey: "progress.tabs.onslaughtDescription",
      },
      {
        path: "/progress/campaigns",
        labelKey: "progress.tabs.campaigns",
        descriptionKey: "progress.tabs.campaignsDescription",
      },
      {
        path: "/progress/campaign-events",
        labelKey: "progress.tabs.campaign-events",
        descriptionKey: "progress.tabs.campaign-eventsDescription",
      },
    ],
  },
  {
    path: "/legendary-events",
    labelKey: "nav.legendaryEvents",
    descriptionKey: "nav.legendaryEventsDescription",
    icon: CalendarDays,
    anonymousAllowed: false,
    mobilePlacement: "menu",
    // The active events come first (see use-nav-items.ts); All events stays last.
    dynamicChildren: "legendaryEvents",
    children: [
      {
        path: "/legendary-events",
        labelKey: "legendaryEvents.tabs.allEvents",
        descriptionKey: "legendaryEvents.tabs.allEventsDescription",
        // The hub is a destination of its own; archived and upcoming event pages nest below it.
        isLandingPage: true,
      },
    ],
  },
  {
    path: "/guild",
    labelKey: "nav.guild",
    descriptionKey: "nav.guildDescription",
    icon: Users,
    anonymousAllowed: false,
    mobilePlacement: "primary",
    children: [
      {
        path: "/guild/members",
        labelKey: "guild.tabs.members",
        descriptionKey: "guild.tabs.membersDescription",
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

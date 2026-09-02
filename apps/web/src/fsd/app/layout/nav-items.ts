import type { LucideIcon } from "lucide-react"
import {
  CalendarCheck,
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
  | "nav.uiKit"
  | "nav.guild"
  | "nav.dailies"
  | "library:section.label"
  | "library:collections.characters.label"
  | "library:collections.machinesOfWar.label"
  | "library:collections.npcs.label"
  | "library:collections.raidBosses.label"
  | "goals.tabs.overview"
  | "goals.tabs.projects"
  | "goals.tabs.insights"
  | "progress.tabs.onslaught"
  | "progress.tabs.campaigns"
  | "progress.tabs.campaign-events"
  | "progress.tabs.xp-income"
  | "guild.tabs.members"
  // Namespace-prefixed ("dailies:...") rather than living in `common.json` like every other
  // section's tab keys: `dailies` is its own long-standing i18n namespace/file, and duplicating
  // its content into `common.json` is an explicitly disallowed regression (see
  // `dailies-translations.test.ts`). `dailies` is preloaded in `i18n.ts` alongside `common` so
  // these resolve correctly in the always-mounted app shell, not just once a Dailies page has
  // been visited.
  | "dailies:tabs.raids"
  | "dailies:tabs.shops"
  | "dailies:tabs.onslaught"
  | "dailies:tabs.salvage-run"
  | "dailies:tabs.arena"
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
    >}Description`
  | "library:section.description"
  | "library:collections.characters.description"
  | "library:collections.machinesOfWar.description"
  | "library:collections.npcs.description"
  | "library:collections.raidBosses.description"

export interface NavSubItem {
  path: string
  labelKey: NavLabelKey
  descriptionKey: NavDescriptionKey
}

export interface NavItem {
  path: string
  labelKey: NavLabelKey
  descriptionKey: NavDescriptionKey
  icon: LucideIcon
  anonymousAllowed: boolean
  children?: NavSubItem[]
  // Where this item surfaces on mobile: a direct bottom-nav destination, or
  // tucked inside the bottom-left hamburger menu. Desktop ignores this and
  // always lists every visible item in the sidebar's main nav.
  mobilePlacement: "primary" | "menu"
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
      },
    ],
  },
  {
    path: "/goals",
    labelKey: "nav.goals",
    descriptionKey: "nav.goalsDescription",
    icon: ListTodo,
    anonymousAllowed: false,
    mobilePlacement: "primary",
    children: [
      {
        path: "/goals/overview",
        labelKey: "goals.tabs.overview",
        descriptionKey: "goals.tabs.overviewDescription",
      },
      {
        path: "/goals/projects",
        labelKey: "goals.tabs.projects",
        descriptionKey: "goals.tabs.projectsDescription",
      },
      {
        path: "/goals/insights",
        labelKey: "goals.tabs.insights",
        descriptionKey: "goals.tabs.insightsDescription",
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
    children: [
      {
        path: "/dailies/raids",
        labelKey: "dailies:tabs.raids",
        descriptionKey: "dailies:tabs.raidsDescription",
      },
      {
        path: "/dailies/shops",
        labelKey: "dailies:tabs.shops",
        descriptionKey: "dailies:tabs.shopsDescription",
      },
      {
        path: "/dailies/onslaught",
        labelKey: "dailies:tabs.onslaught",
        descriptionKey: "dailies:tabs.onslaughtDescription",
      },
      {
        path: "/dailies/salvage-run",
        labelKey: "dailies:tabs.salvage-run",
        descriptionKey: "dailies:tabs.salvage-runDescription",
      },
      {
        path: "/dailies/arena",
        labelKey: "dailies:tabs.arena",
        descriptionKey: "dailies:tabs.arenaDescription",
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
      {
        path: "/progress/xp-income",
        labelKey: "progress.tabs.xp-income",
        descriptionKey: "progress.tabs.xp-incomeDescription",
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

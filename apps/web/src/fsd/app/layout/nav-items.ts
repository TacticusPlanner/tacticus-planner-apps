import type { LucideIcon } from "lucide-react"
import {
  CalendarCheck,
  Home,
  LayoutGrid,
  ListTodo,
  TrendingUp,
  Search,
  Users,
} from "lucide-react"

import { isUiKitEnabled } from "@/shared/config"

type NavLabelKey =
  | "nav.home"
  | "nav.lookup"
  | "nav.goals"
  | "nav.progress"
  | "nav.uiKit"
  | "nav.guild"
  | "nav.dailies"
  | "unitLookup.tabs.character"
  | "unitLookup.tabs.mow"
  | "unitLookup.tabs.npc"
  | "goals.tabs.projects"
  | "goals.tabs.insights"
  | "progress.tabs.onslaught"
  | "progress.tabs.campaigns"
  | "progress.tabs.campaign-events"
  | "progress.tabs.xp-income"
  | "guild.tabs.members"

export interface NavSubItem {
  path: string
  labelKey: NavLabelKey
}

export interface NavItem {
  path: string
  labelKey: NavLabelKey
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
    icon: Home,
    anonymousAllowed: false,
    mobilePlacement: "primary",
  },
  {
    path: "/lookup",
    labelKey: "nav.lookup",
    icon: Search,
    anonymousAllowed: true,
    mobilePlacement: "menu",
    children: [
      {
        path: "/lookup/character",
        labelKey: "unitLookup.tabs.character",
      },
      {
        path: "/lookup/mow",
        labelKey: "unitLookup.tabs.mow",
      },
      {
        path: "/lookup/npc",
        labelKey: "unitLookup.tabs.npc",
      },
    ],
  },
  {
    path: "/goals",
    labelKey: "nav.goals",
    icon: ListTodo,
    anonymousAllowed: false,
    mobilePlacement: "primary",
    children: [
      {
        path: "/goals/project",
        labelKey: "goals.tabs.projects",
      },
      {
        path: "/goals/insights",
        labelKey: "goals.tabs.insights",
      },
    ],
  },
  {
    path: "/dailies",
    labelKey: "nav.dailies",
    icon: CalendarCheck,
    anonymousAllowed: false,
    mobilePlacement: "primary",
  },
  {
    path: "/progress",
    labelKey: "nav.progress",
    icon: TrendingUp,
    anonymousAllowed: false,
    mobilePlacement: "menu",
    children: [
      {
        path: "/progress/onslaught",
        labelKey: "progress.tabs.onslaught",
      },
      {
        path: "/progress/campaigns",
        labelKey: "progress.tabs.campaigns",
      },
      {
        path: "/progress/campaign-events",
        labelKey: "progress.tabs.campaign-events",
      },
      {
        path: "/progress/xp-income",
        labelKey: "progress.tabs.xp-income",
      },
    ],
  },
  {
    path: "/guild",
    labelKey: "nav.guild",
    icon: Users,
    anonymousAllowed: false,
    mobilePlacement: "primary",
    children: [
      {
        path: "/guild/members",
        labelKey: "guild.tabs.members",
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
          icon: LayoutGrid,
          anonymousAllowed: true,
          mobilePlacement: "menu" as const,
        },
      ]
    : []),
]

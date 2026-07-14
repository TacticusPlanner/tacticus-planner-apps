import type { LucideIcon } from "lucide-react"
import { Home, LayoutGrid, ListTodo, Search, Users } from "lucide-react"

import { isUiKitEnabled } from "@/shared/config"

export interface NavItem {
  path: string
  labelKey:
    "nav.home" | "nav.lookup" | "nav.createGoal" | "nav.uiKit" | "nav.guild"
  icon: LucideIcon
  anonymousAllowed: boolean
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
  },
  {
    path: "/goals",
    labelKey: "nav.createGoal",
    icon: ListTodo,
    anonymousAllowed: false,
    mobilePlacement: "primary",
  },
  {
    path: "/guild",
    labelKey: "nav.guild",
    icon: Users,
    anonymousAllowed: false,
    mobilePlacement: "primary",
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

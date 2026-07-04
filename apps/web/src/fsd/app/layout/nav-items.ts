import type { LucideIcon } from "lucide-react"
import { Home, Palette, Search } from "lucide-react"

import { isUiKitEnabled } from "@/shared/config"

type NavLabelKey = "nav.home" | "nav.lookup" | "nav.createGoal" | "nav.uiKit"
type MobilePlacement = "bottom" | "menu"

export interface NavItem {
  path: string
  labelKey: NavLabelKey
  icon: LucideIcon
  anonymousAllowed: boolean
  mobilePlacement: MobilePlacement
}

const baseNavItems: NavItem[] = [
  {
    path: "/home",
    labelKey: "nav.home",
    icon: Home,
    anonymousAllowed: false,
    mobilePlacement: "bottom",
  },
  {
    path: "/lookup",
    labelKey: "nav.lookup",
    icon: Search,
    anonymousAllowed: true,
    mobilePlacement: "menu",
  },
]

export const navItems: NavItem[] = isUiKitEnabled
  ? [
      ...baseNavItems,
      {
        path: "/ui-kit",
        labelKey: "nav.uiKit",
        icon: Palette,
        anonymousAllowed: true,
        mobilePlacement: "menu",
      },
    ]
  : baseNavItems

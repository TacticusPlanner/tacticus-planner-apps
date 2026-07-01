import type { LucideIcon } from "lucide-react"
import { Home, Search } from "lucide-react"

export interface NavItem {
  path: string
  labelKey: "nav.home" | "nav.rankLookup" | "nav.createGoal"
  icon: LucideIcon
  anonymousAllowed: boolean
}

export const navItems: NavItem[] = [
  { path: "/home", labelKey: "nav.home", icon: Home, anonymousAllowed: false },
  {
    path: "/lookup/ranks",
    labelKey: "nav.rankLookup",
    icon: Search,
    anonymousAllowed: true,
  },
]

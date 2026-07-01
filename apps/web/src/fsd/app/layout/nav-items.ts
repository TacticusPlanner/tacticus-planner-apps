import type { LucideIcon } from "lucide-react"
import { Home, Search } from "lucide-react"

export interface NavItem {
  path: string
  labelKey: "nav.home" | "nav.lookup" | "nav.createGoal"
  icon: LucideIcon
  anonymousAllowed: boolean
}

export const navItems: NavItem[] = [
  { path: "/home", labelKey: "nav.home", icon: Home, anonymousAllowed: false },
  {
    path: "/lookup",
    labelKey: "nav.lookup",
    icon: Search,
    anonymousAllowed: true,
  },
]

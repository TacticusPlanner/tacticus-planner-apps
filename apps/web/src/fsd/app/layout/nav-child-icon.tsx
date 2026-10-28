import { cn } from "@workspace/ui/lib/utils"

import type { NavSubItem } from "./nav-items"

/** A child's leading icon: a dynamic child's portrait, else a static child's game art or lucide icon. */
export function NavChildIcon({
  child,
  className,
}: {
  child: NavSubItem
  className?: string
}) {
  if ("iconSrc" in child && child.iconSrc) {
    return (
      <img
        alt=""
        aria-hidden="true"
        className={cn("size-5 shrink-0 rounded-full object-cover", className)}
        src={child.iconSrc}
      />
    )
  }
  if ("artSrc" in child && child.artSrc) {
    return (
      <img
        alt=""
        aria-hidden="true"
        className={cn("size-5 shrink-0 object-contain", className)}
        src={child.artSrc}
      />
    )
  }
  if ("icon" in child && child.icon) {
    const Icon = child.icon
    return (
      <Icon
        aria-hidden="true"
        className={cn("size-4 shrink-0", className)}
        data-testid="nav-child-icon"
      />
    )
  }
  return null
}

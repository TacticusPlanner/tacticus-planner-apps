import { cn } from "@workspace/ui/lib/utils"

import type { NavItem, NavSubItem } from "./nav-items"

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
        className={cn(
          "size-icon shrink-0 rounded-full object-cover",
          className
        )}
        src={child.iconSrc}
      />
    )
  }
  // The game's nav art is detailed and wider than tall, so at 20px it reads smaller than the
  // lucide glyphs beside it; it is drawn a step up, at `size-icon-md` (24px), like `NavItemIcon`
  // below. `-my-0.5` keeps the row as tall as a 20px icon's row.
  if ("artSrc" in child && child.artSrc) {
    return (
      <img
        alt=""
        aria-hidden="true"
        className={cn(
          "-my-0.5 size-icon-md shrink-0 object-contain",
          className
        )}
        src={child.artSrc}
      />
    )
  }
  if ("icon" in child && child.icon) {
    const Icon = child.icon
    return (
      <Icon
        aria-hidden="true"
        className={cn("size-icon shrink-0", className)}
        data-testid="nav-child-icon"
      />
    )
  }
  return null
}

/** A section's icon: the game's own art for it, else its lucide glyph. */
export function NavItemIcon({
  item,
  className,
}: {
  item: NavItem
  className?: string
}) {
  if (item.artSrc) {
    return (
      <img
        alt=""
        aria-hidden="true"
        className={cn("size-icon-md shrink-0 object-contain", className)}
        src={item.artSrc}
      />
    )
  }
  const Icon = item.icon
  return (
    <Icon aria-hidden="true" className={cn("size-icon shrink-0", className)} />
  )
}

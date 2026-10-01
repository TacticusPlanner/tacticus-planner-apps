import { useTranslation } from "react-i18next"
import { cn } from "@workspace/ui/lib/utils"

import { useIsHseLive } from "./hse-live-context"
import type { NavItem, NavSubItem } from "./nav-items"

/**
 * The shared "event live" marker. Renders nothing unless the item names a signal (`liveIndicator`)
 * that is currently on, so a renderer only passes its item. The dot is decorative; the sibling
 * `sr-only` text is what assistive technology reads with the link name, so colour is never the only
 * cue. The pulse is `motion-safe` only. `corner` overlays an icon (the parent must be `relative`);
 * `hidden` lets search results opt out.
 */
export function NavLiveDot({
  item,
  corner = false,
  hidden = false,
  className,
}: {
  item: Pick<NavItem | NavSubItem, "liveIndicator">
  corner?: boolean
  hidden?: boolean
  className?: string
}) {
  const { t } = useTranslation("common")
  const isHseLive = useIsHseLive()
  const isLive = item.liveIndicator === "hse" && isHseLive

  if (!isLive || hidden) return null

  return (
    <>
      <span
        aria-hidden="true"
        className={cn(
          "size-2 shrink-0 rounded-full bg-red-500 motion-safe:animate-pulse",
          corner ? "absolute -top-0.5 -right-0.5" : "ml-1.5 inline-block",
          className
        )}
        data-testid="nav-live-dot"
      />
      <span className="sr-only">{t("nav.eventLive")}</span>
    </>
  )
}

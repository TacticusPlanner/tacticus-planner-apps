import { useTranslation } from "react-i18next"
import { cn } from "@workspace/ui/lib/utils"

import { LiveBadge, LiveDot } from "@/shared/ui"

import { useEventLiveSignals } from "./hse-live-context"
import type { NavItem, NavSubItem } from "./nav-items"

/**
 * The navigation's "event live" marker. Renders nothing unless the item names a signal
 * (`liveIndicator`) that is currently on, so a renderer only passes its item. Beside a label it is
 * the shared `LiveBadge` (green `success` tokens, read as "on now" rather than as an alert); `corner`
 * overlays a bare dot on an icon (the parent must be `relative`), where a label would not fit. The
 * `sr-only` text is what assistive technology reads with the link name, so colour is never the
 * only cue. The pulse is `motion-safe` only. `hidden` lets search results opt out.
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
  const signals = useEventLiveSignals()
  const isLive =
    item.liveIndicator === "events"
      ? signals.hse || signals.hre || signals.quest
      : item.liveIndicator
        ? signals[item.liveIndicator]
        : false

  if (!isLive || hidden) return null

  return (
    <>
      {corner ? (
        <LiveDot
          className={cn(
            "absolute -top-0.5 -right-0.5 ring-2 ring-background",
            className
          )}
          data-testid="nav-live-dot"
          pulse
        />
      ) : (
        <LiveBadge
          aria-hidden="true"
          className={cn("ml-1.5", className)}
          data-testid="nav-live-badge"
          dotTestId="nav-live-dot"
          label={t("nav.live")}
          pulse
        />
      )}
      <span className="sr-only">{t("nav.eventLive")}</span>
    </>
  )
}

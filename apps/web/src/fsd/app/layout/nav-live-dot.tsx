import { useTranslation } from "react-i18next"
import { Badge } from "@workspace/ui/components/badge"
import { cn } from "@workspace/ui/lib/utils"

import { useEventLiveSignals } from "./hse-live-context"
import type { NavItem, NavSubItem } from "./nav-items"

/**
 * The shared "event live" marker. Renders nothing unless the item names a signal (`liveIndicator`)
 * that is currently on, so a renderer only passes its item. It uses the green `success` tokens so it
 * reads as "on now" rather than as an alert. Beside a label it is a small "Live" badge; `corner`
 * overlays a bare dot on an icon (the parent must be `relative`), where a label would not fit. Both
 * carry an "Event live" hover tooltip, and the `sr-only` text is what assistive technology reads
 * with the link name, so colour is never the only cue. The pulse is `motion-safe` only. `hidden`
 * lets search results opt out.
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

  const dot = (
    <span
      aria-hidden="true"
      className={cn(
        "size-2 shrink-0 rounded-full bg-success-foreground motion-safe:animate-pulse",
        corner && "absolute -top-0.5 -right-0.5 ring-2 ring-background",
        corner && className
      )}
      data-testid="nav-live-dot"
      title={corner ? t("nav.eventLive") : undefined}
    />
  )

  return (
    <>
      {corner ? (
        dot
      ) : (
        <Badge
          aria-hidden="true"
          className={cn("ml-1.5 bg-success text-success-foreground", className)}
          data-testid="nav-live-badge"
          title={t("nav.eventLive")}
        >
          {dot}
          {t("nav.live")}
        </Badge>
      )}
      <span className="sr-only">{t("nav.eventLive")}</span>
    </>
  )
}

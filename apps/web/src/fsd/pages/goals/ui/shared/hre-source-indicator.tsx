import { useTranslation } from "react-i18next"
import { Link } from "react-router"
import { gameMenuIcon } from "@workspace/game-catalog"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { cn } from "@workspace/ui/lib/utils"
import { Pressable } from "@workspace/ui/components/pressable"

import type { HreShardSource } from "@/entities/hre-mission"
import { formatDateRange, formatShortDate } from "@/shared/lib"
import { EntityIcon } from "@/shared/ui"

import { hreSourceCopy } from "../../model/shared/hre-source-copy"

/**
 * Shown beside a goal's status instead of "Blocked" when the shards it can't farm come from the
 * featured hero's Hero Release Event: "HRE live" while it runs, "HRE <start date>" before it
 * starts. The popover says what the event gives and links to it on the HRE tab.
 */
export function HreSourceIndicator({
  source,
  unitName,
  isUnlock,
  className,
}: {
  source: HreShardSource | null | undefined
  unitName: string
  /** An Unlock goal reads "unlock in the HRE" rather than "shards come from the HRE". */
  isUnlock: boolean
  /** Extra classes for the chip, matching `StatusBadge`'s `className` beside it. */
  className?: string
}) {
  const { t, i18n } = useTranslation()
  if (!source) return null
  const locale = i18n.resolvedLanguage ?? "en"
  const copy = hreSourceCopy(source, isUnlock)
  const label = t(copy.labelKey, {
    date: formatShortDate(source.startUtc, locale),
  })
  const text = t(copy.textKey, {
    unit: unitName,
    end: formatShortDate(source.endUtc, locale),
    range: formatDateRange(source.startUtc, source.endUtc, locale),
  })

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Pressable
          aria-label={`${label}: ${text}`}
          className="relative inline-flex cursor-pointer rounded-2xl after:absolute after:-inset-x-1 after:-inset-y-2 pointer-coarse:after:-inset-y-3.5"
        >
          <Badge
            className={cn(
              "gap-1",
              source.status === "running"
                ? "border-transparent bg-success text-success-foreground"
                : "text-foreground",
              className
            )}
            variant="outline"
          >
            <EntityIcon
              alt=""
              size="icon"
              src={gameMenuIcon("heroReleaseEvent")}
            />
            {label}
          </Badge>
        </Pressable>
      </PopoverTrigger>
      <PopoverContent className="grid w-72 gap-2 text-sm" collisionPadding={16}>
        <p>{text}</p>
        <Button asChild className="justify-self-start" size="sm" variant="link">
          <Link
            to={`/dailies/hre?event=${encodeURIComponent(source.eventKey)}`}
          >
            {t("goals.hreSource.openPlanner")}
          </Link>
        </Button>
      </PopoverContent>
    </Popover>
  )
}

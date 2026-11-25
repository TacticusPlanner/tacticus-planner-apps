import type { ReactNode } from "react"
import { Card } from "@workspace/ui/components/card"
import { cn } from "@workspace/ui/lib/utils"
import { ChevronDown } from "lucide-react"

/**
 * One glance tile: a short label above its value. Below 42rem of page content it drops its card
 * chrome and becomes a label / value row of the single glance card. With `href` (an in-page
 * `#card-id`) the whole tile is a native link to the card it sums up: it scrolls there, moves focus
 * and works from the keyboard. The link sits in the value, named by `linkLabel` ("Shops: 3 to buy"),
 * so the definition list stays valid; a chevron marks it on a phone and the tile's hover state on
 * wider screens.
 */
export function GlanceTile({
  children,
  className,
  href,
  label,
  labelClassName,
  linkLabel,
  testId,
  valueClassName,
}: {
  children: ReactNode
  className?: string
  href?: string
  label: ReactNode
  labelClassName?: string
  linkLabel?: string
  testId?: string
  valueClassName?: string
}) {
  return (
    <Card
      className={cn(
        "min-w-0 flex-row items-center justify-between gap-3 rounded-none bg-transparent px-0 py-2 shadow-none ring-0",
        "@2xl:min-h-19 @2xl:flex-col @2xl:items-stretch @2xl:justify-start @2xl:gap-1.5 @2xl:rounded-[min(var(--radius-4xl),24px)] @2xl:bg-card @2xl:px-4 @2xl:py-3 @2xl:shadow-sm @2xl:ring-1",
        href &&
          "relative has-[a:focus-visible]:ring-3 has-[a:focus-visible]:ring-ring/50 @2xl:interactive-surface",
        className
      )}
      data-testid={testId}
      size="sm"
    >
      <dt
        className={cn("shrink-0 text-xs text-muted-foreground", labelClassName)}
      >
        {label}
      </dt>
      <dd
        className={cn(
          "min-w-0 flex-1 text-end text-sm font-semibold tabular-nums @2xl:flex-none @2xl:text-start @2xl:text-lg",
          valueClassName
        )}
      >
        {href ? (
          // The link stretches over the whole tile (`after:inset-0`), so a tap anywhere on it works.
          <a
            aria-label={linkLabel}
            className="flex items-center justify-end gap-1 outline-none after:absolute after:inset-0 @2xl:justify-start"
            href={href}
          >
            {children}
            <ChevronDown
              aria-hidden="true"
              className="size-icon shrink-0 text-muted-foreground @2xl:hidden"
            />
          </a>
        ) : (
          children
        )}
      </dd>
    </Card>
  )
}

import type { ReactNode } from "react"
import { cn } from "@workspace/ui/lib/utils"

const LABEL_TONE = {
  default: "text-foreground",
  muted: "text-muted-foreground",
} as const

/**
 * The one labelled divider between sections of a list (Raided, Shops, Cleared, Not matching, Flex,
 * the Goals season cut-off): the label at the left edge, where the eye scans a list, then a rule to
 * the right edge. Wrap it in the list's own item (`li`, a full-width `td`) where one is needed.
 *
 * - `heading` renders the label as that heading level, for a divider that starts a section; without
 *   it the divider is a labelled separator.
 * - `chip` puts the label in a bordered pill (the season cut-off, which must stand out over cards).
 * - `lineClassName` recolours or thickens the rule (the season cut-off's fit colour).
 *
 * A label too long for the row wraps; the rule keeps a short stub beside it.
 */
export function ListDivider({
  label,
  icon,
  heading,
  tone = "muted",
  chip = false,
  lineClassName,
  className,
  "aria-label": ariaLabel,
  "data-testid": testId,
}: {
  label: ReactNode
  /** A small leading icon, decorative. */
  icon?: ReactNode
  heading?: "h2" | "h3" | "h4" | "h5"
  tone?: keyof typeof LABEL_TONE
  chip?: boolean
  lineClassName?: string
  className?: string
  /** The separator's name, when `label` is not plain text. */
  "aria-label"?: string
  "data-testid"?: string
}) {
  const Label = heading ?? "span"
  const separator =
    heading === undefined
      ? {
          role: "separator" as const,
          "aria-label":
            ariaLabel ?? (typeof label === "string" ? label : undefined),
        }
      : {}
  return (
    <div
      className={cn("flex items-center gap-2 py-2", className)}
      data-testid={testId}
      {...separator}
    >
      <Label
        className={cn(
          "inline-flex min-w-0 items-center gap-1.5 text-sm font-medium",
          LABEL_TONE[tone],
          chip && "rounded-full border bg-card px-2.5 py-0.5"
        )}
      >
        {icon}
        {label}
      </Label>
      <span
        aria-hidden="true"
        className={cn("h-px min-w-4 flex-1 bg-border", lineClassName)}
      />
    </div>
  )
}

import type { ReactNode } from "react"
import { Label } from "@workspace/ui/components/label"
import { cn } from "@workspace/ui/lib/utils"

/** A labeled, non-editable value — visually matches a disabled Select/Input trigger (same height,
 * padding, and border) so a read-only "From" field sits flush next to an editable target field,
 * without looking like an interactive control. */
export function ReadOnlyField({
  label,
  children,
  className,
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div
        className={cn(
          "flex h-8 items-center gap-1.5 rounded-2xl border bg-muted/50 px-3 text-sm text-muted-foreground",
          className
        )}
      >
        {children}
      </div>
    </div>
  )
}

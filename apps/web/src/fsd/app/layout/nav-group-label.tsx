import { useTranslation } from "react-i18next"
import { cn } from "@workspace/ui/lib/utils"

import type { NavGroupLabelKey } from "./nav-items"

/** A group's label above its first child in the section menu, drawer and navigation dialog. */
export function NavGroupLabel({
  labelKey,
  id,
  className,
}: {
  labelKey: NavGroupLabelKey
  id?: string
  className?: string
}) {
  const { t } = useTranslation("common")
  return (
    <div
      className={cn(
        "px-3 pt-3 pb-1 text-xs font-medium text-muted-foreground first:pt-1",
        className
      )}
      data-testid="nav-group-label"
      id={id}
    >
      {t(labelKey)}
    </div>
  )
}

import { useTranslation } from "react-i18next"
import { Spinner } from "@workspace/ui/components/spinner"
import { cn } from "@workspace/ui/lib/utils"

/**
 * A whole page or panel whose shape is not known yet (ui-style-guide rule 11): one centred
 * `Spinner`, with `label` beside it when given ("Loading the team"). It is a live region named by
 * the label, or "Loading…" without one.
 */
export function PageLoading({
  label,
  className,
  testId,
}: {
  label?: string
  className?: string
  testId?: string
}) {
  const { t } = useTranslation()
  return (
    <div
      aria-label={label ?? t("common.loading")}
      className={cn(
        "flex min-h-64 items-center justify-center gap-2 text-sm text-muted-foreground",
        className
      )}
      data-testid={testId}
      role="status"
    >
      <Spinner
        aria-hidden="true"
        className={label ? undefined : "size-icon-lg"}
      />
      {label ? <span aria-hidden="true">{label}</span> : null}
    </div>
  )
}

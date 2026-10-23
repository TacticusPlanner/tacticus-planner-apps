import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import type { RulesText } from "@/shared/ability-text"

/**
 * Stands in for rules text that is still downloading (a loading line) or failed to download (a
 * failure note with a retry). Render it only when `rulesTextPending`; text that loaded but does not
 * exist is the caller's missing-text case.
 */
export function RulesTextNote({
  rules,
  className,
  "data-testid": testId,
}: {
  rules: RulesText<unknown>
  className?: string
  "data-testid": string
}) {
  const { t } = useTranslation("library")
  const box = cn(
    "rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground",
    className
  )

  if (!rules.ready) {
    return (
      <p role="status" className={box} data-testid={`${testId}-loading`}>
        {t("unit.ability.loadingText")}
      </p>
    )
  }
  return (
    <div
      className={cn(box, "flex flex-wrap items-center gap-2")}
      data-testid={`${testId}-failed`}
    >
      <p role="alert">{t("unit.ability.textFailed")}</p>
      <Button size="sm" variant="outline" onClick={rules.retry}>
        {t("unit.retry")}
      </Button>
    </div>
  )
}

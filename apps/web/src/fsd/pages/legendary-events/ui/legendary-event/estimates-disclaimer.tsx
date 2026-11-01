import { Info } from "lucide-react"
import { useTranslation } from "react-i18next"

/** A page-wide reminder that every clear, point and token estimate on the event page comes from a
 *  raw power comparison, so real battle results can differ. */
export function EstimatesDisclaimer() {
  const { t } = useTranslation("legendaryEvents")
  return (
    <p
      className="flex items-start gap-1.5 text-xs text-muted-foreground"
      data-testid="legendary-event-estimates-disclaimer"
    >
      <Info aria-hidden="true" className="mt-px size-3.5 shrink-0" />
      <span>{t("estimates.disclaimer")}</span>
    </p>
  )
}

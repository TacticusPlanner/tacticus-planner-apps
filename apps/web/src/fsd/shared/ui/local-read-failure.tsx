import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"

/** The failure presentation for a local read that failed or timed out, for views without their
 *  own: the localized message and a Retry that re-issues the read. */
export function LocalReadFailure({ retry }: { retry: () => void }) {
  const { t } = useTranslation()
  return (
    <div role="alert" className="flex flex-col items-start gap-2 py-4 text-sm">
      <p className="text-muted-foreground">{t("localData.readFailed")}</p>
      <Button variant="outline" size="sm" onClick={retry}>
        {t("localData.retry")}
      </Button>
    </div>
  )
}

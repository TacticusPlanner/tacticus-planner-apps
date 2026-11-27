import { useTranslation } from "react-i18next"
import { Info, X } from "lucide-react"
import {
  Alert,
  AlertAction,
  AlertDescription,
} from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"

import { storedPreference, useStoredFlag } from "@/shared/lib"

const NOTICE_DISMISSED = storedPreference("dismissed", "guildWarApiNotice")

/** Says the Tacticus API has no Guild War data, so attacks are logged by hand. Dismissed once per
 *  device. */
export function GuildWarApiNotice() {
  const { t } = useTranslation("guildWar")
  const [dismissed, setDismissed] = useStoredFlag(NOTICE_DISMISSED)
  if (dismissed) return null
  return (
    <Alert data-testid="guild-war-api-notice">
      <Info />
      <AlertDescription>{t("page.apiNotice")}</AlertDescription>
      <AlertAction>
        <Button
          aria-label={t("page.apiNoticeDismiss")}
          onClick={() => setDismissed(true)}
          size="icon-sm"
          variant="ghost"
        >
          <X />
        </Button>
      </AlertAction>
    </Alert>
  )
}

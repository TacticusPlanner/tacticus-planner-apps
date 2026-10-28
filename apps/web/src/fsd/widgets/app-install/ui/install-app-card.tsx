import { CircleCheck, Download } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"

import { useAnalyticsActions } from "@/shared/analytics"

import { useAppInstall } from "../model/use-app-install"
import { useInstallGuide } from "../model/use-install-guide"
import { InstallAppDialog } from "./install-app-dialog"

/** Home's install offer: one tap where the browser has an install prompt, else the guide. Once the
 *  app is installed during the visit it turns into the shortcuts tip. Not now hides it for good on
 *  this device; the account menu's Install app stays. */
export function InstallAppCard() {
  const { t } = useTranslation()
  const install = useAppInstall()
  const guide = useInstallGuide("homeCard", install)
  const { captureEvent } = useAnalyticsActions()

  if (!install.showCard) return null

  const dismiss = () => {
    if (!install.justInstalled) {
      captureEvent({
        type: "app_install_card_dismissed",
        platform: install.platform,
      })
    }
    install.dismissCard()
  }

  return (
    <Card className="py-4" data-testid="app-install-card">
      <CardContent className="flex flex-col gap-3 px-4 sm:flex-row sm:items-center">
        {install.justInstalled ? (
          <CircleCheck
            aria-hidden="true"
            className="hidden size-8 shrink-0 text-primary sm:block"
          />
        ) : (
          <img
            alt=""
            className="hidden size-10 shrink-0 sm:block"
            src="/web-app-manifest-192x192.png"
          />
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h2 className="text-sm font-medium">
            {install.justInstalled
              ? t("appInstall.card.installedTitle")
              : t("appInstall.card.title")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {install.justInstalled
              ? t("appInstall.card.installedBody")
              : t("appInstall.card.body")}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          {install.justInstalled ? (
            <Button onClick={dismiss} size="sm" variant="secondary">
              {t("appInstall.card.gotIt")}
            </Button>
          ) : (
            <>
              {install.canPrompt ? (
                <Button onClick={() => void guide.runPrompt()} size="sm">
                  <Download aria-hidden="true" />
                  {t("appInstall.install")}
                </Button>
              ) : (
                <Button onClick={guide.openGuide} size="sm">
                  {t("appInstall.card.howTo")}
                </Button>
              )}
              <Button onClick={dismiss} size="sm" variant="ghost">
                {t("appInstall.card.notNow")}
              </Button>
            </>
          )}
        </div>
      </CardContent>
      <InstallAppDialog
        install={install}
        onOpenChange={guide.setGuideOpen}
        open={guide.guideOpen}
        runPrompt={guide.runPrompt}
      />
    </Card>
  )
}

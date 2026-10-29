import {
  CircleCheck,
  Download,
  EllipsisVertical,
  Share,
  SquarePlus,
  type LucideIcon,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import { DialogDescription } from "@workspace/ui/components/dialog"

import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/shared/ui"

import { APP_SHORTCUTS } from "../model/app-shortcuts"
import type { InstallPromptOutcome } from "../model/install-prompt-store"
import { installSteps, type InstallStepIcon } from "../model/install-steps"
import type { AppInstallState } from "../model/use-app-install"

const STEP_ICONS: Record<InstallStepIcon, LucideIcon> = {
  share: Share,
  addToHome: SquarePlus,
  menu: EllipsisVertical,
  install: Download,
  confirm: CircleCheck,
}

/** The install guide: the browser's one-tap Install where it offers one, otherwise the manual steps
 *  for this platform, and then the shortcuts the installed app's icon offers. */
export function InstallAppDialog({
  open,
  onOpenChange,
  install,
  runPrompt,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  install: Pick<AppInstallState, "platform" | "canPrompt" | "installed">
  runPrompt: () => Promise<InstallPromptOutcome>
}) {
  const { t } = useTranslation()
  const steps = installSteps(install.platform)
  // A Chromium browser that offers no prompt has usually installed the app already.
  const maybeInstalled =
    !install.canPrompt &&
    (install.platform === "android" || install.platform === "desktop")

  const handleInstall = async () => {
    const outcome = await runPrompt()
    if (outcome === "accepted") onOpenChange(false)
  }

  return (
    <ResponsiveDialog
      contentClassName="sm:max-w-lg"
      data-testid="app-install-dialog"
      onOpenChange={onOpenChange}
      open={open}
    >
      <ResponsiveDialogHeader>
        <ResponsiveDialogTitle>
          {t("appInstall.dialog.title")}
        </ResponsiveDialogTitle>
        <DialogDescription>
          {t("appInstall.dialog.description")}
        </DialogDescription>
      </ResponsiveDialogHeader>
      <ResponsiveDialogBody className="gap-5 pb-4">
        {install.installed ? (
          <p className="text-sm">{t("appInstall.dialog.installed")}</p>
        ) : install.canPrompt ? (
          <Button
            className="self-start"
            data-testid="app-install-dialog-install"
            onClick={() => void handleInstall()}
          >
            <Download aria-hidden="true" />
            {t("appInstall.install")}
          </Button>
        ) : steps.length > 0 ? (
          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-medium">
              {t("appInstall.dialog.stepsHeading")}
            </h3>
            <ol className="flex flex-col gap-2">
              {steps.map((step, index) => {
                const Icon = STEP_ICONS[step.icon]
                return (
                  <li className="flex items-start gap-3 text-sm" key={step.key}>
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                      {index + 1}
                    </span>
                    <Icon
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                    />
                    <span>{t(step.key)}</span>
                  </li>
                )
              })}
            </ol>
            {maybeInstalled ? (
              <p className="text-xs text-muted-foreground">
                {t("appInstall.dialog.maybeInstalled")}
              </p>
            ) : null}
          </section>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t("appInstall.dialog.unsupported")}
          </p>
        )}
        <section
          className="flex flex-col gap-2"
          data-testid="app-install-shortcuts"
        >
          <h3 className="text-sm font-medium">
            {t("appInstall.shortcuts.heading")}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t("appInstall.shortcuts.body")}
          </p>
          <ul className="flex flex-col gap-1.5">
            {APP_SHORTCUTS.map((shortcut) => (
              <li
                className="flex items-center gap-2 text-sm"
                key={shortcut.url}
              >
                <img
                  alt=""
                  className="size-7 rounded-full"
                  src={shortcut.iconSrc}
                />
                {t(shortcut.labelKey)}
              </li>
            ))}
          </ul>
        </section>
      </ResponsiveDialogBody>
      <ResponsiveDialogFooter className="border-t">
        <Button onClick={() => onOpenChange(false)} variant="secondary">
          {t("common.close")}
        </Button>
      </ResponsiveDialogFooter>
    </ResponsiveDialog>
  )
}

import { useId, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useIsAuthenticated } from "@azure/msal-react"
import { Label } from "@workspace/ui/components/label"
import { Switch } from "@workspace/ui/components/switch"

import {
  PageSettingsButton,
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/shared/ui"

import { useShowPaidOptions } from "../model/use-show-paid-options"
import { useWatchAds } from "../model/use-watch-ads"

/**
 * The Legendary Events settings button (spec: Legendary Event settings): the page header's
 * "Settings" button (ui-style-guide rule 1) on every Legendary Events page, opening a dialog with the account-wide Show paid options and Watch daily ads switches.
 * Each switch saves at once and applies to every event's planner.
 */
export function LegendaryEventSettingsButton() {
  const { t } = useTranslation("legendaryEvents")
  const signedIn = useIsAuthenticated()
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  // Settings are account preferences, so signed-out players get no button.
  if (!signedIn) return null
  return (
    <>
      <PageSettingsButton
        onClick={() => setOpen(true)}
        ref={buttonRef}
        testId="legendary-event-settings"
      />
      <ResponsiveDialog
        data-testid="legendary-event-settings-dialog"
        desktopClassName="sm:max-w-md"
        // Opened from state, so focus goes back to the Settings button by hand.
        onCloseAutoFocus={(event) => {
          event.preventDefault()
          buttonRef.current?.focus()
        }}
        onOpenChange={setOpen}
        open={open}
      >
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{t("settings.title")}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {t("settings.description")}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody className="pt-2 pb-6">
          <LegendaryEventSettingsForm />
        </ResponsiveDialogBody>
      </ResponsiveDialog>
    </>
  )
}

function LegendaryEventSettingsForm() {
  const { t } = useTranslation("legendaryEvents")
  const paid = useShowPaidOptions()
  const ads = useWatchAds()
  // Each save is built from the loaded settings, so the switches wait for the read and for the
  // previous save: a second change made meanwhile would drop the first one's flag. A failed read
  // leaves only the defaults, so a save then would overwrite the account's other settings.
  const [saving, setSaving] = useState(false)
  const busy = paid.loading || paid.failed || saving
  const save = (write: Promise<unknown>) => {
    setSaving(true)
    void write.finally(() => setSaving(false))
  }
  return (
    <div className="flex flex-col gap-3">
      <SettingSwitch
        checked={paid.showPaidOptions}
        disabled={busy}
        hint={t("settings.showPaidOptionsHint")}
        label={t("runInputs.showPaidOptions")}
        onChange={(on) => save(paid.setShowPaidOptions(on))}
        testId="legendary-event-settings-paid"
      />
      <SettingSwitch
        checked={ads.watchAds}
        disabled={busy}
        hint={t("runInputs.watchAdsHint")}
        label={t("runInputs.watchAds")}
        onChange={(on) => save(ads.setWatchAds(on))}
        testId="legendary-event-settings-ads"
      />
    </div>
  )
}

function SettingSwitch({
  checked,
  disabled,
  label,
  hint,
  testId,
  onChange,
}: {
  checked: boolean
  disabled: boolean
  label: string
  hint: string
  testId: string
  onChange: (on: boolean) => void
}) {
  const id = useId()
  const hintId = useId()
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border p-3">
      <div className="flex flex-col gap-0.5">
        <Label htmlFor={id}>{label}</Label>
        <p className="text-xs text-muted-foreground" id={hintId}>
          {hint}
        </p>
      </div>
      <Switch
        aria-describedby={hintId}
        checked={checked}
        data-testid={testId}
        disabled={disabled}
        id={id}
        onCheckedChange={onChange}
      />
    </div>
  )
}

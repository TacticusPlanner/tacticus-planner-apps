import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { useAnalyticsActions } from "@/shared/analytics"

import {
  hasPreference,
  usePlanningSettings,
  withPreference,
} from "@/entities/planning-setting"

const FLAG = "LegendaryEventShowPaidOptions" as const

/** The account's Show paid options (off by default), a user preference flag so it applies to every
 *  Legendary Event; `loading` while the account settings load, `failed` when that read failed. A failed write shows the run
 *  inputs toast. */
export function useShowPaidOptions() {
  const { t } = useTranslation("legendaryEvents")
  const { settings, loading, failed, retry, save } = usePlanningSettings()
  const { captureEvent } = useAnalyticsActions()
  const setShowPaidOptions = (on: boolean) =>
    save(withPreference(settings, FLAG, on))
      .then(() =>
        captureEvent({ type: "legendary_event_paid_options_toggled", on })
      )
      .catch(() => {
        toast.error(t("runInputs.toasts.error"))
      })
  return {
    showPaidOptions: hasPreference(settings, FLAG),
    loading,
    /** The settings read failed, so `showPaidOptions` is the default rather than the account's. */
    failed,
    retry,
    setShowPaidOptions,
  }
}

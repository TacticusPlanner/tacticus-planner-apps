import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import {
  usePlanningSettings,
  watchesDailyAds,
  withPreference,
} from "@/entities/planning-setting"

/** The account's Watch daily ads (on by default: the Skip daily ads preference turned off), read and
 *  written through the user settings so it applies to every Legendary Event; a failed write shows the
 *  run inputs toast. */
export function useWatchAds() {
  const { t } = useTranslation("legendaryEvents")
  const { settings, save } = usePlanningSettings()
  const setWatchAds = (watchAds: boolean) =>
    save(
      withPreference(settings, "LegendaryEventSkipDailyAds", !watchAds)
    ).catch(() => {
      toast.error(t("runInputs.toasts.error"))
    })
  return { watchAds: watchesDailyAds(settings), setWatchAds }
}

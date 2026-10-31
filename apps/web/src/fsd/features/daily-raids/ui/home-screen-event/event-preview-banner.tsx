import { useTranslation } from "react-i18next"
import { Info } from "lucide-react"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"

import { formatRelativeTime, getDeviceLocale } from "@/shared/lib"

import type { HomeScreenEventEntry } from "../../model/select-active-home-screen-event"
import { useHomeScreenEventName } from "./use-home-screen-event-name"

/** Labels the HSE lists as a preview of an upcoming event (the next one, or any later one the player
 * selected): not live, computed with its rules and the
 * energy left today, so nobody mistakes them for points that can be earned right now. */
export function EventPreviewBanner({ entry }: { entry: HomeScreenEventEntry }) {
  const { t, i18n } = useTranslation(["dailies"])
  const eventName = useHomeScreenEventName()
  const startMs = Date.parse(entry.startUtc)
  return (
    <Alert data-testid="hse-preview-banner">
      <Info aria-hidden="true" />
      <AlertTitle>
        {t("dailies:hse.preview.title", { name: eventName(entry) })}
      </AlertTitle>
      <AlertDescription>
        {t("dailies:hse.preview.body", {
          when: formatRelativeTime(startMs, i18n.language),
          date: new Date(startMs).toLocaleString(getDeviceLocale(), {
            dateStyle: "medium",
            timeStyle: "short",
          }),
        })}
      </AlertDescription>
    </Alert>
  )
}

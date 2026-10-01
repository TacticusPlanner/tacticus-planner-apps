import { useTranslation } from "react-i18next"
import { Info } from "lucide-react"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"

import { formatRelativeTime } from "@/shared/lib"

import type { HomeScreenEventEntry } from "../../model/select-active-home-screen-event"

/** Labels the HSE lists as a preview of the next event: not live, computed with its rules and the
 * energy left today, so nobody mistakes them for points that can be earned right now. */
export function EventPreviewBanner({ entry }: { entry: HomeScreenEventEntry }) {
  const { t, i18n } = useTranslation(["dailies", "events"])
  const startMs = Date.parse(entry.startUtc)
  return (
    <Alert data-testid="hse-preview-banner">
      <Info aria-hidden="true" />
      <AlertTitle>
        {t("dailies:hse.preview.title", {
          name: t(`events:definitions.${entry.definitionId}`, {
            defaultValue: entry.definitionId,
          }),
        })}
      </AlertTitle>
      <AlertDescription>
        {t("dailies:hse.preview.body", {
          when: formatRelativeTime(startMs, i18n.language),
          date: new Date(startMs).toLocaleString(i18n.language, {
            dateStyle: "medium",
            timeStyle: "short",
          }),
        })}
      </AlertDescription>
    </Alert>
  )
}

import { useTranslation } from "react-i18next"

import type { HseTokenMode } from "@/entities/home-screen-event"

/** A token mode's localized name. */
export function useModeName() {
  const { t } = useTranslation("dailies")
  return (mode: HseTokenMode) => t(`hse.details.modes.${mode}`)
}

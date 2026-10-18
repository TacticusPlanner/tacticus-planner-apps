import { useTranslation } from "react-i18next"

import type { HseTokenMode } from "../lib/hse-token-supply"

/** A token mode's localized name. */
export function useModeName() {
  const { t } = useTranslation("dailies")
  return (mode: HseTokenMode) => t(`hse.details.modes.${mode}`)
}

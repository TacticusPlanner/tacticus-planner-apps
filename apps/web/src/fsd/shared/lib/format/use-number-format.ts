import { useTranslation } from "react-i18next"

import { numberFormat } from "./format-number"

/**
 * A number format in the app language, not the browser's: `useNumberFormat().format(12590)` is
 * "12,590" in English and "12.590" in German. Re-renders when the language changes.
 */
export function useNumberFormat(
  options?: Intl.NumberFormatOptions
): Intl.NumberFormat {
  const { i18n } = useTranslation()
  return numberFormat(i18n.language, options)
}

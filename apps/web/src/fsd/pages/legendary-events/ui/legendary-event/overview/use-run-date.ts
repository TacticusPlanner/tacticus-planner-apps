import { useTranslation } from "react-i18next"

/** The local date of a record's last progress, in the UI language. */
export function useRunDate(progressAt: string): string {
  const { i18n } = useTranslation("legendaryEvents")
  return new Intl.DateTimeFormat(i18n.language, { dateStyle: "medium" }).format(
    new Date(progressAt)
  )
}

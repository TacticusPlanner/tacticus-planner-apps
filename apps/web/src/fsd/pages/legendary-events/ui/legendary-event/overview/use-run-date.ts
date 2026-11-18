import { formatShortDate, useDateLocale } from "@/shared/lib"

/** The local date of a record's last progress, in the shared short format. */
export function useRunDate(progressAt: string): string {
  const dateLocale = useDateLocale()
  return formatShortDate(progressAt, dateLocale)
}

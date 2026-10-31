import { useDateLocale } from "@/shared/lib"

/** The local date of a record's last progress, in the device's regional format. */
export function useRunDate(progressAt: string): string {
  const dateLocale = useDateLocale()
  return new Intl.DateTimeFormat(dateLocale, {
    dateStyle: "medium",
  }).format(new Date(progressAt))
}

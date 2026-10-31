import { getDeviceLocale } from "@/shared/lib"

/** The local date of a record's last progress, in the device's regional format. */
export function useRunDate(progressAt: string): string {
  return new Intl.DateTimeFormat(getDeviceLocale(), {
    dateStyle: "medium",
  }).format(new Date(progressAt))
}

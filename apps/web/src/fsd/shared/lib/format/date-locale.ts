import { useTranslation } from "react-i18next"

/** The runtime's default locale: what the browser derives from the OS / browser regional settings. */
function defaultDeviceLocale(): string {
  return new Intl.DateTimeFormat().resolvedOptions().locale
}

/**
 * The locale to format calendar dates and clock times in: the UI language's words (month and
 * weekday names) with the device's regional conventions (region and 12/24-hour clock). A player
 * running the app in English on a Ukrainian-region device gets "31 Oct 2026, 15:20" rather than
 * either the US default "Oct 31, 2026, 3:20 PM" or Ukrainian month names.
 *
 * Worded output such as countdowns ("in 3 days") and relative times stays on the UI language alone.
 */
export function resolveDateLocale(
  uiLanguage: string,
  deviceLocale: string = defaultDeviceLocale()
): string {
  try {
    const device = new Intl.Locale(deviceLocale)
    const ui = new Intl.Locale(uiLanguage)
    // The device already speaks the UI language: its own locale carries everything, extensions included.
    if (device.language === ui.language) return device.toString()
    const { region } = device.maximize()
    const { hourCycle } = new Intl.DateTimeFormat(deviceLocale, {
      hour: "numeric",
    }).resolvedOptions()
    return new Intl.Locale(ui.language, { region, hourCycle }).toString()
  } catch {
    return uiLanguage
  }
}

/** `resolveDateLocale` for the active UI language; re-renders when the language changes. */
export function useDateLocale(): string {
  const { i18n } = useTranslation()
  return resolveDateLocale(i18n.language)
}

interface WeekInfo {
  firstDay: number
}

/**
 * The device's first day of the week, as `Date#getDay` numbers it (0 = Sunday … 6 = Saturday).
 * Falls back to Monday where the browser does not expose week data (Firefox at the time of writing).
 */
export function getDeviceFirstDayOfWeek(
  deviceLocale: string = defaultDeviceLocale()
): number {
  try {
    const locale = new Intl.Locale(deviceLocale) as Intl.Locale & {
      getWeekInfo?: () => WeekInfo
      weekInfo?: WeekInfo
    }
    const firstDay = (locale.getWeekInfo?.() ?? locale.weekInfo)?.firstDay
    if (firstDay === undefined) return 1
    return firstDay % 7
  } catch {
    return 1
  }
}

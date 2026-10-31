/**
 * The locale to format calendar dates and clock times in: the device's own regional format, not the
 * UI language. A player can run the app in English while their device uses Ukrainian (or British,
 * or German…) date and time conventions, and stamps should read the way every other app on that
 * device does: day/month order, 24-hour clock and so on.
 *
 * This is the runtime's default locale, which browsers derive from the OS / browser regional
 * settings (including any `-u-hc-` hour-cycle preference they expose). Worded output, such as
 * countdowns ("in 3 days") or relative times, stays in the UI language and must not use this.
 */
export function getDeviceLocale(): string {
  return new Intl.DateTimeFormat().resolvedOptions().locale
}

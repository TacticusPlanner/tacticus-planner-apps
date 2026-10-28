/**
 * The shortcuts the installed app offers on a long-press (right-click on desktop) of its icon. They
 * mirror `shortcuts` in public/site.webmanifest, which the browser reads; the guide lists these so
 * the tip matches what the icon shows (app-shortcuts.test.ts keeps the two in step).
 */
export const APP_SHORTCUTS = [
  {
    labelKey: "appInstall.shortcuts.dailyRaids",
    url: "/dailies/raids",
    iconSrc: "/shortcuts/raids.png",
  },
  {
    labelKey: "appInstall.shortcuts.goals",
    url: "/plan/goals",
    iconSrc: "/shortcuts/goals.png",
  },
  {
    labelKey: "appInstall.shortcuts.legendaryEvents",
    url: "/legendary-events",
    iconSrc: "/shortcuts/legendary-events.png",
  },
] as const

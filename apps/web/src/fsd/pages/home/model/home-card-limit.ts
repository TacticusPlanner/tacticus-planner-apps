/** How many items Home's list cards (Daily raids, Your projects, Upcoming events) show before
 *  "Show N more": the same count in each, fewer on a phone, where the cards stack in one column. */
const HOME_CARD_LIMIT = { desktop: 5, mobile: 3 } as const

export function homeCardLimit(isMobile: boolean): number {
  return isMobile ? HOME_CARD_LIMIT.mobile : HOME_CARD_LIMIT.desktop
}

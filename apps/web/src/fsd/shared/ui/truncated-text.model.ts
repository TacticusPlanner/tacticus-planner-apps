/** Whether the text in `element` is cut off by `truncate` (one line) or `line-clamp-*`. */
export function isTextCut(element: HTMLElement | null): boolean {
  if (!element) return false
  return (
    element.scrollWidth > element.clientWidth ||
    element.scrollHeight > element.clientHeight
  )
}

const CONTROL_SELECTOR =
  'a[href], button, label, [role="button"], [role="link"], [role="option"], [role="menuitem"], [role="tab"]'

/** Whether `element` sits inside a control a tap already acts on (a link, a button, a row). */
export function sitsInsideControl(element: HTMLElement | null): boolean {
  return Boolean(element?.parentElement?.closest(CONTROL_SELECTOR))
}

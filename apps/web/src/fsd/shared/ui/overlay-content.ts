const OVERLAY_CONTENT_SELECTOR =
  '[data-slot="dialog-content"],[data-slot="sheet-content"]'

/** The nearest enclosing dialog or sheet content node, for popovers/comboboxes that must portal
 * inside it (Radix's scroll lock blocks wheel/touch scrolling in a popover portalled to `body`).
 * `undefined` when there is none, so the popover falls back to its default portal. */
export function closestOverlayContent(
  element: Element | null | undefined
): HTMLElement | undefined {
  return (
    (element?.closest(OVERLAY_CONTENT_SELECTOR) as HTMLElement | null) ??
    undefined
  )
}

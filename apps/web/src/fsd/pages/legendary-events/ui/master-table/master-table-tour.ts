/** The tour's portal (tooltip and overlay) as react-joyride renders it. */
const TOUR_ELEMENT_SELECTOR = "#react-joyride-portal, .react-joyride__floater"

/** Whether `target` belongs to the running tour (its tooltip or overlay), which a modal sheet must
 *  not treat as an outside interaction. */
export function isTourElement(target: EventTarget | null): boolean {
  return (
    target instanceof Element && target.closest(TOUR_ELEMENT_SELECTOR) !== null
  )
}

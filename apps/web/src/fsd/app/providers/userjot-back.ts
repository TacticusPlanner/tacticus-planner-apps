// The widget's screens each carry their own header Back button, but the SDK exposes no way to
// navigate its internal router (only open/close). The widget renders into an open shadow root on
// our page, so Android Back presses that button when a screen has one, and closes the widget
// otherwise. Tied to the v3 SDK's markup: if a release changes it, no button is found and Back
// just closes the widget, which is still correct.
const WIDGET_HOST_ID = "userjot-engage-root"

// The widget's `chrome.actions.back` label in each language the app ships (the app sets the
// widget's locale to its own).
const WIDGET_BACK_LABELS = new Set(["Back", "Zurück", "Atrás", "Retour"])

/** The open widget screen's own Back button, if it has one. */
export function findWidgetBackButton(): HTMLButtonElement | undefined {
  const root = document.getElementById(WIDGET_HOST_ID)?.shadowRoot
  if (!root) return undefined
  return [
    ...root.querySelectorAll<HTMLButtonElement>("button[aria-label]"),
  ].find(
    (button) =>
      WIDGET_BACK_LABELS.has(button.getAttribute("aria-label") ?? "") &&
      !button.disabled
  )
}

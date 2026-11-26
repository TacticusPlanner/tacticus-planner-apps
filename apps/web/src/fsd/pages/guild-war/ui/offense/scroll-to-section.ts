/** Scrolls the page to a section by its id (smoothly, unless the player prefers reduced motion) and
 *  moves focus there without a second scroll, so keyboard and screen reader users land on it too. */
export function scrollToSection(id: string) {
  const section = document.getElementById(id)
  if (!section) return
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  section.scrollIntoView({
    block: "start",
    behavior: reduce ? "auto" : "smooth",
  })
  if (!section.hasAttribute("tabindex")) section.setAttribute("tabindex", "-1")
  section.focus({ preventScroll: true })
}

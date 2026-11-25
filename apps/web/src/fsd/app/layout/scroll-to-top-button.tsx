import { useSyncExternalStore } from "react"
import { ArrowUp } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"

// A page only counts as "very long" once its scrollable distance is at least this many viewport
// heights — short/medium pages never show the button, no matter how far you scroll.
const LONG_PAGE_VIEWPORT_MULTIPLIER = 1.5
// ...and even on a very long page, the button only appears once the user has scrolled past this
// fraction of the scrollable distance (~15-25% per the design ask; 0.2 splits the difference).
const SCROLL_THRESHOLD_RATIO = 0.2

/** Whether the page is very long and scrolled far enough down to offer the button. */
function readShowScrollToTop(): boolean {
  const viewportHeight = window.innerHeight
  const scrollable = document.documentElement.scrollHeight - viewportHeight
  const isVeryLongPage =
    scrollable > viewportHeight * LONG_PAGE_VIEWPORT_MULTIPLIER
  const scrolledRatio = scrollable > 0 ? window.scrollY / scrollable : 0
  return isVeryLongPage && scrolledRatio > SCROLL_THRESHOLD_RATIO
}

/** Notifies on scroll and resize, at most once per animation frame. */
function subscribeToScroll(onChange: () => void): () => void {
  let frame: number | null = null
  const onScrollOrResize = () => {
    if (frame !== null) return
    frame = requestAnimationFrame(() => {
      frame = null
      onChange()
    })
  }
  window.addEventListener("scroll", onScrollOrResize, { passive: true })
  window.addEventListener("resize", onScrollOrResize)
  return () => {
    window.removeEventListener("scroll", onScrollOrResize)
    window.removeEventListener("resize", onScrollOrResize)
    if (frame !== null) cancelAnimationFrame(frame)
  }
}

function useShowScrollToTop(): boolean {
  return useSyncExternalStore(
    subscribeToScroll,
    readShowScrollToTop,
    () => false
  )
}

/** Mobile-only "back to top" FAB — mounted once in the mobile shell, hidden on desktop by never
 *  being rendered there. Only appears on very long pages, once the user has scrolled a fair way
 *  down (see the thresholds above), so it doesn't clutter short pages or the very top of long ones. */
export function ScrollToTopButton() {
  const { t } = useTranslation()
  const show = useShowScrollToTop()

  if (!show) return null

  return (
    <Button
      aria-label={t("scrollToTop")}
      data-testid="scroll-to-top-button"
      className="fixed right-4 bottom-[calc(var(--mobile-nav-height)+1rem)] z-40 size-12 rounded-full shadow-lg [&_svg]:size-icon-md"
      size="icon"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      <ArrowUp />
    </Button>
  )
}

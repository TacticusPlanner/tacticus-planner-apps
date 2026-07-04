import { useEffect, useState } from "react"
import { ArrowUp } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"

// A page only counts as "very long" once its scrollable distance is at least this many viewport
// heights — short/medium pages never show the button, no matter how far you scroll.
const LONG_PAGE_VIEWPORT_MULTIPLIER = 1.5
// ...and even on a very long page, the button only appears once the user has scrolled past this
// fraction of the scrollable distance (~15-25% per the design ask; 0.2 splits the difference).
const SCROLL_THRESHOLD_RATIO = 0.2

function useShowScrollToTop(): boolean {
  const [show, setShow] = useState(false)

  useEffect(() => {
    let ticking = false

    const updateVisibility = () => {
      ticking = false
      const viewportHeight = window.innerHeight
      const scrollable = document.documentElement.scrollHeight - viewportHeight
      const isVeryLongPage =
        scrollable > viewportHeight * LONG_PAGE_VIEWPORT_MULTIPLIER
      const scrolledRatio = scrollable > 0 ? window.scrollY / scrollable : 0
      setShow(isVeryLongPage && scrolledRatio > SCROLL_THRESHOLD_RATIO)
    }

    const onScrollOrResize = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(updateVisibility)
    }

    updateVisibility()
    window.addEventListener("scroll", onScrollOrResize, { passive: true })
    window.addEventListener("resize", onScrollOrResize)
    return () => {
      window.removeEventListener("scroll", onScrollOrResize)
      window.removeEventListener("resize", onScrollOrResize)
    }
  }, [])

  return show
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
      className="fixed right-4 bottom-[calc(var(--mobile-nav-height)+1rem)] z-40 size-12 rounded-full shadow-lg [&_svg]:size-5"
      size="icon"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      <ArrowUp />
    </Button>
  )
}

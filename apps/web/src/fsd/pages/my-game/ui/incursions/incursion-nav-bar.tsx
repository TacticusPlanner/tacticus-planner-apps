import { Link } from "react-router"
import { useTranslation } from "react-i18next"
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@workspace/ui/components/button"

type NavTarget = { to: string; name: string }

/**
 * The top bar of an Incursion MoW or tier page, like the Library's unit pages: back to the list it
 * came from, the breadcrumb, and prev/next with the position. Every button keeps its text label on
 * mobile too (no icon-only controls); the row wraps instead, and the breadcrumb then shows only the
 * page's own name.
 */
export function IncursionNavBar({
  back,
  breadcrumb,
  previous,
  next,
  position,
}: {
  back: { to: string; label: string }
  /** Section names, then the page's own name (shown last, in bold). */
  breadcrumb: readonly string[]
  previous?: NavTarget
  next?: NavTarget
  /** "2 of 4". */
  position?: string
}) {
  const { t } = useTranslation("incursions")

  const stepButton = (
    target: NavTarget | undefined,
    direction: "previous" | "next"
  ) => {
    const Icon = direction === "previous" ? ChevronLeft : ChevronRight
    const label = target
      ? t(`nav.${direction}Item`, { name: target.name })
      : t(`nav.${direction}`)
    const content = (
      <>
        {direction === "previous" && <Icon aria-hidden="true" />}
        {t(`nav.${direction}`)}
        {direction === "next" && <Icon aria-hidden="true" />}
      </>
    )
    if (!target) {
      return (
        <Button
          variant="outline"
          disabled
          aria-label={label}
          data-testid={`incursion-nav-${direction}`}
        >
          {content}
        </Button>
      )
    }
    return (
      <Button asChild variant="outline">
        <Link
          to={target.to}
          aria-label={label}
          data-testid={`incursion-nav-${direction}`}
        >
          {content}
        </Link>
      </Button>
    )
  }

  const crumbs = breadcrumb.slice(0, -1)
  const current = breadcrumb.at(-1)

  return (
    <nav
      aria-label={t("nav.label")}
      className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border bg-card px-3 py-2 md:px-4"
      data-testid="incursion-nav-bar"
    >
      <Button asChild className="max-w-full min-w-0" variant="outline">
        <Link
          to={back.to}
          aria-label={t("nav.backTo", { label: back.label })}
          data-testid="incursion-nav-back"
        >
          <ArrowLeft aria-hidden="true" />
          <span className="truncate">{back.label}</span>
        </Link>
      </Button>
      <p className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
        {crumbs.map((crumb) => (
          <span key={crumb} className="max-sm:hidden">
            {crumb}
            <span aria-hidden="true"> / </span>
          </span>
        ))}
        <span className="font-semibold text-foreground">{current}</span>
      </p>
      <div className="flex items-center gap-2 max-sm:w-full max-sm:justify-between">
        {stepButton(previous, "previous")}
        {position ? (
          <span
            className="text-xs text-muted-foreground tabular-nums"
            data-testid="incursion-nav-position"
          >
            {position}
          </span>
        ) : null}
        {stepButton(next, "next")}
      </div>
    </nav>
  )
}

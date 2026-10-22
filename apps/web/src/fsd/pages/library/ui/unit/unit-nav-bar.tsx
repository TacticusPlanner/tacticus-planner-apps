import { Link, type To } from "react-router"
import { useTranslation } from "react-i18next"
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@workspace/ui/components/button"

import { COLLECTION_ORIGIN_PATH, type UnitOrigin } from "@/entities/unit"

type NavTarget = { to: To; name: string; state: unknown }

/**
 * The unit page's top bar: back (labelled by where it goes), the Library breadcrumb, and prev/next
 * with the unit's position. Back goes to the page's list unless the unit was opened from Collection.
 * The page tour button lives in the app header, as on every page.
 */
export function UnitNavBar({
  back: listBack,
  origin,
  breadcrumb,
  previous,
  next,
  position,
  isMobile,
}: {
  /** The page's own list, the back target unless `origin` says otherwise. */
  back: { to: string; label: string }
  origin?: UnitOrigin
  /** Section names, then the unit's name (shown last, in bold). */
  breadcrumb: readonly string[]
  previous?: NavTarget
  next?: NavTarget
  /** "2 of 4", or nothing when the unit isn't in the order. */
  position?: string
  isMobile: boolean
}) {
  const { t } = useTranslation(["library", "common"])
  const size = isMobile ? "size-11" : "h-10"
  const back =
    origin?.kind === "collection"
      ? {
          to: COLLECTION_ORIGIN_PATH,
          label: t("common:myGame.tabs.collection"),
        }
      : listBack

  const stepButton = (
    target: NavTarget | undefined,
    direction: "previous" | "next"
  ) => {
    const Icon = direction === "previous" ? ChevronLeft : ChevronRight
    const label = target
      ? t(`unit.nav.${direction}Unit`, { name: target.name })
      : t(`unit.nav.${direction}`)
    const content = (
      <>
        {direction === "previous" && <Icon aria-hidden="true" />}
        {isMobile ? null : t(`unit.nav.${direction}`)}
        {direction === "next" && <Icon aria-hidden="true" />}
      </>
    )
    if (!target) {
      return (
        <Button
          variant="outline"
          size={isMobile ? "icon" : "default"}
          className={size}
          disabled
          aria-label={label}
          data-testid={`unit-nav-${direction}`}
        >
          {content}
        </Button>
      )
    }
    return (
      <Button
        asChild
        variant="outline"
        size={isMobile ? "icon" : "default"}
        className={size}
      >
        <Link
          to={target.to}
          state={target.state}
          aria-label={label}
          data-testid={`unit-nav-${direction}`}
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
      aria-label={t("unit.nav.label")}
      className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b bg-card px-4 py-3 md:px-6"
      data-testid="unit-nav-bar"
    >
      <Button
        asChild
        variant="outline"
        size={isMobile ? "icon" : "default"}
        className={size}
      >
        <Link
          to={back.to}
          aria-label={t("unit.nav.backTo", { label: back.label })}
          data-testid="unit-nav-back"
        >
          <ArrowLeft aria-hidden="true" />
          {isMobile ? null : back.label}
        </Link>
      </Button>
      {isMobile ? null : (
        <p className="min-w-0 truncate text-sm text-muted-foreground">
          {crumbs.map((crumb) => (
            <span key={crumb}>
              {crumb}
              <span aria-hidden="true"> / </span>
            </span>
          ))}
          <span className="font-semibold text-foreground">{current}</span>
        </p>
      )}
      <div className="ml-auto flex items-center gap-2">
        {stepButton(previous, "previous")}
        {position ? (
          <span
            className="text-xs text-muted-foreground tabular-nums"
            data-testid="unit-nav-position"
          >
            {position}
          </span>
        ) : null}
        {stepButton(next, "next")}
      </div>
    </nav>
  )
}

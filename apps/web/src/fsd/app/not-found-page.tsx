import { SearchX } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"
import { Button } from "@workspace/ui/components/button"

/**
 * What an address the app does not serve shows, inside the shell: a mistyped or outdated link says
 * so instead of silently dropping the visitor on another page. It offers the place a signed-in user
 * starts from, or a guest's public way in.
 */
export function NotFoundPage({
  isAuthenticated,
}: {
  isAuthenticated: boolean
}) {
  const { t } = useTranslation()

  return (
    <div
      className="flex flex-1 items-center justify-center p-6"
      data-testid="not-found-page"
    >
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <SearchX aria-hidden="true" className="size-10 text-muted-foreground" />
        <h2 className="text-lg font-semibold">{t("notFound.title")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("notFound.description")}
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {isAuthenticated ? (
            <Button asChild>
              <Link to="/home">{t("notFound.goHome")}</Link>
            </Button>
          ) : (
            <>
              <Button asChild>
                <Link to="/library/characters">
                  {t("notFound.browseLibrary")}
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/">{t("notFound.goToStart")}</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

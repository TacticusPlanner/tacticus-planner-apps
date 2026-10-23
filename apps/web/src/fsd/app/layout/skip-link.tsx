import { useTranslation } from "react-i18next"

/** Visually hidden until focused; the first tab stop of each shell. Focuses `<main id="main">`
 *  directly rather than following the hash, so the URL and router location stay unchanged. */
export function SkipLink() {
  const { t } = useTranslation()

  return (
    <a
      className="sr-only rounded-md bg-background px-3 py-2 text-sm font-medium shadow-md focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:ring-3 focus:ring-ring"
      href="#main"
      onClick={(event) => {
        event.preventDefault()
        document.getElementById("main")?.focus()
      }}
    >
      {t("nav.skipToContent")}
    </a>
  )
}

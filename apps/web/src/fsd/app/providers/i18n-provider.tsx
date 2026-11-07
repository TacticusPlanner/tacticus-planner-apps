import type { ReactNode } from "react"
import * as React from "react"

import { I18nextProvider } from "react-i18next"

import { getSupportedLanguage, i18n } from "@/shared/config"

import { AuthResolving } from "../auth-route-guards"

type I18nProviderProps = {
  children: ReactNode
}

function setDocumentLanguage(language: string) {
  document.documentElement.lang = getSupportedLanguage(language)
}

export function I18nProvider({ children }: I18nProviderProps) {
  React.useEffect(() => {
    if (i18n.language) setDocumentLanguage(i18n.language)

    i18n.on("languageChanged", setDocumentLanguage)
    return () => i18n.off("languageChanged", setDocumentLanguage)
  }, [])

  return (
    <I18nextProvider i18n={i18n}>
      {/* The boot screen, as for the auth check, instead of a blank page while translations load. */}
      <React.Suspense fallback={<AuthResolving />}>{children}</React.Suspense>
    </I18nextProvider>
  )
}

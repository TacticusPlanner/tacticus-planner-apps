import type { ReactNode } from "react"
import * as React from "react"

import { I18nextProvider } from "react-i18next"

import { i18n } from "@/shared/config"

type I18nProviderProps = {
  children: ReactNode
}

export function I18nProvider({ children }: I18nProviderProps) {
  return (
    <I18nextProvider i18n={i18n}>
      <React.Suspense fallback={null}>{children}</React.Suspense>
    </I18nextProvider>
  )
}

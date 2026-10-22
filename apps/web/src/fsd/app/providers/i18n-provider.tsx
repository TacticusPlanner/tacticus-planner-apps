import type { ReactNode } from "react"
import * as React from "react"

import { I18nextProvider } from "react-i18next"

import { i18n } from "@/shared/config"

import { AuthResolving } from "../auth-route-guards"

type I18nProviderProps = {
  children: ReactNode
}

export function I18nProvider({ children }: I18nProviderProps) {
  return (
    <I18nextProvider i18n={i18n}>
      {/* The same indicator as the auth check, instead of a blank page while translations load. */}
      <React.Suspense fallback={<AuthResolving />}>{children}</React.Suspense>
    </I18nextProvider>
  )
}

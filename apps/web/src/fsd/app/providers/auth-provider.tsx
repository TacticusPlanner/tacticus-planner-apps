import { useEffect, type ReactNode } from "react"

import type { IPublicClientApplication } from "@azure/msal-browser"
import { MsalProvider } from "@azure/msal-react"

import { startSilentSignInOnce } from "@/shared/auth"

type AuthProviderProps = {
  children: ReactNode
  instance: IPublicClientApplication
}

export function AuthProvider({ children, instance }: AuthProviderProps) {
  useEffect(() => {
    startSilentSignInOnce(instance)
  }, [instance])

  return <MsalProvider instance={instance}>{children}</MsalProvider>
}

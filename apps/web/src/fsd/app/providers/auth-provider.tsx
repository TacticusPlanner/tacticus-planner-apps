import type { ReactNode } from "react"

import type { IPublicClientApplication } from "@azure/msal-browser"
import { MsalProvider } from "@azure/msal-react"

type AuthProviderProps = {
  children: ReactNode
  instance: IPublicClientApplication
}

export function AuthProvider({ children, instance }: AuthProviderProps) {
  return <MsalProvider instance={instance}>{children}</MsalProvider>
}

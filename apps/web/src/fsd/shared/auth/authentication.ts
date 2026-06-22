import {
  BrowserCacheLocation,
  EventType,
  LogLevel,
  PublicClientApplication,
  type AuthenticationResult,
  type Configuration,
  type EventMessage,
  type RedirectRequest,
} from "@azure/msal-browser"

function getRequiredEnvironmentValue(
  name: "VITE_MSAL_AUTHORITY" | "VITE_MSAL_CLIENT_ID" | "VITE_MSAL_TENANT_ID"
) {
  const value = import.meta.env[name]?.trim()

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

function createMsalConfig(): Configuration {
  const authority = getRequiredEnvironmentValue("VITE_MSAL_AUTHORITY")
  const clientId = getRequiredEnvironmentValue("VITE_MSAL_CLIENT_ID")
  const tenantId = getRequiredEnvironmentValue("VITE_MSAL_TENANT_ID")

  return {
    auth: {
      authority,
      clientId,
      knownAuthorities: [
        new URL(authority).origin,
        `https://${tenantId}.ciamlogin.com`,
      ],
      postLogoutRedirectUri: window.location.origin,
      redirectUri: new URL("/redirect", window.location.origin).href,
    },
    cache: {
      cacheLocation: BrowserCacheLocation.SessionStorage,
    },
    system: {
      loggerOptions: {
        loggerCallback: (
          level: LogLevel,
          message: string,
          containsPii: boolean
        ) => {
          if (containsPii) {
            return
          }

          switch (level) {
            case LogLevel.Error:
              console.error(message)
              break
            case LogLevel.Warning:
              console.warn(message)
              break
            case LogLevel.Info:
              console.info(message)
              break
            case LogLevel.Verbose:
              console.debug(message)
              break
          }
        },
      },
    },
  }
}

export const loginRequest: RedirectRequest = {
  scopes: [],
}

export async function initializeAuthentication() {
  const msalInstance = new PublicClientApplication(createMsalConfig())

  await msalInstance.initialize()

  msalInstance.addEventCallback((event: EventMessage) => {
    if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
      const result = event.payload as AuthenticationResult

      msalInstance.setActiveAccount(result.account)
    }
  })

  const redirectResult = await msalInstance.handleRedirectPromise({
    navigateToLoginRequestUrl: false,
  })

  if (redirectResult) {
    msalInstance.setActiveAccount(redirectResult.account)
  }

  if (!msalInstance.getActiveAccount()) {
    const [cachedAccount] = msalInstance.getAllAccounts()

    if (cachedAccount) {
      msalInstance.setActiveAccount(cachedAccount)
    }
  }

  return msalInstance
}

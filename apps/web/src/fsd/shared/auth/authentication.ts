import {
  BrowserAuthError,
  BrowserAuthErrorCodes,
  BrowserCacheLocation,
  EventType,
  InteractionRequiredAuthError,
  LogLevel,
  PublicClientApplication,
  type AuthenticationResult,
  type Configuration,
  type EventMessage,
  type IPublicClientApplication,
  type RedirectRequest,
} from "@azure/msal-browser"

import { getRequiredEnvironmentValue } from "../config/environment"

let authentication: PublicClientApplication | undefined

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
      redirectUri: new URL("/auth/callback", window.location.origin).href,
    },
    cache: {
      cacheLocation: BrowserCacheLocation.LocalStorage,
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
  get scopes() {
    return [getRequiredEnvironmentValue("VITE_API_SCOPE")]
  },
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

  authentication = msalInstance

  return msalInstance
}

class AuthenticationUnavailableError extends Error {
  constructor() {
    super("No authenticated account is available.")
    this.name = "AuthenticationUnavailableError"
  }
}

function getAuthentication() {
  if (!authentication) {
    throw new AuthenticationUnavailableError()
  }

  return authentication
}

function getActiveAccount() {
  const instance = getAuthentication()
  const account = instance.getActiveAccount() ?? instance.getAllAccounts()[0]

  if (!account) {
    throw new AuthenticationUnavailableError()
  }

  return { account, instance }
}

export async function acquireAccessToken() {
  const { account, instance } = getActiveAccount()
  const result = await instance.acquireTokenSilent({
    account,
    scopes: loginRequest.scopes,
  })

  return result.accessToken
}

export function isInteractionRequired(error: unknown) {
  if (error instanceof InteractionRequiredAuthError) {
    return true
  }

  // acquireTokenSilent falls back to a hidden "prompt=none" iframe whenever the cache has no usable
  // refresh token. That iframe can never complete silently when the browser blocks third-party
  // cookies (Safari ITP, Chrome/Firefox privacy modes, etc.) or the IdP session has expired, so it
  // just runs out the clock and MSAL reports a plain timeout rather than InteractionRequiredAuthError.
  // Treat it the same way: only an interactive (redirect) request can resolve it.
  return (
    error instanceof BrowserAuthError &&
    error.errorCode === BrowserAuthErrorCodes.timedOut
  )
}

export function requestApiAccess() {
  const { account, instance } = getActiveAccount()

  return instance.acquireTokenRedirect({
    account,
    scopes: loginRequest.scopes,
  })
}

export type SilentSignInOutcome = "success" | "no-cached-account" | "failed"

export async function attemptSilentSignIn(
  instance: IPublicClientApplication
): Promise<SilentSignInOutcome> {
  if (instance.getAllAccounts().length === 0) {
    return "no-cached-account"
  }

  try {
    const result = await instance.ssoSilent(loginRequest)

    instance.setActiveAccount(result.account)

    return "success"
  } catch (error) {
    // A rejected/timed-out silent attempt is an expected, common outcome (no live IdP session,
    // third-party storage blocked) and is never surfaced to the user - only log the cases
    // isInteractionRequired() doesn't already account for, since those are genuinely unexpected.
    if (!isInteractionRequired(error)) {
      console.error("[MSAL] silent sign-in failed unexpectedly", error)
    }

    return "failed"
  }
}

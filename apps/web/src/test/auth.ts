// Test-owned stand-in for `@azure/msal-react`, installed for every test from `setup.ts`.
// Per-file `vi.mock("@azure/msal-react")` calls still override it.
import type { ReactNode } from "react"
import type { AccountInfo } from "@azure/msal-browser"
import { vi } from "vitest"

type TestAuthState = { authenticated: boolean; account: AccountInfo | null }

export const testAccount: AccountInfo = {
  homeAccountId: "test-home-account-id",
  environment: "login.test",
  tenantId: "test-tenant",
  username: "tester@example.com",
  localAccountId: "test-local-account-id",
  name: "Tester",
}

let state: TestAuthState = { authenticated: false, account: null }

/** Sets the signed-in state the stubbed MSAL hooks and instance report. */
export function setTestAuth({
  authenticated,
  account,
}: {
  authenticated: boolean
  account?: AccountInfo | null
}) {
  state = {
    authenticated,
    account: authenticated ? (account ?? testAccount) : null,
  }
}

function createInstance() {
  const methods = {
    getAllAccounts: vi.fn(() => (state.account ? [state.account] : [])),
    getActiveAccount: vi.fn(() => state.account),
    setActiveAccount: vi.fn((account: AccountInfo | null) => {
      state = { authenticated: account !== null, account }
    }),
    acquireTokenSilent: vi.fn(async () => ({
      accessToken: "test-access-token",
      account: state.account,
    })),
    ssoSilent: vi.fn(async () => ({
      accessToken: "test-access-token",
      account: state.account,
    })),
    loginRedirect: vi.fn(async () => {}),
    acquireTokenRedirect: vi.fn(async () => {}),
    handleRedirectPromise: vi.fn(async () => null),
    initialize: vi.fn(async () => {}),
  }

  // An unknown call throws, so drift between app code and this stub surfaces in the first test
  // that hits it. `then` stays undefined so the instance is never mistaken for a promise.
  return new Proxy(methods, {
    get(target, property, receiver) {
      if (property in target || typeof property === "symbol") {
        return Reflect.get(target, property, receiver)
      }
      if (property === "then") {
        return undefined
      }
      throw new Error(`MSAL test stub does not implement instance.${property}`)
    },
  })
}

export let instance = createInstance()

export function resetTestAuth() {
  state = { authenticated: false, account: null }
  instance = createInstance()
}

export function useIsAuthenticated() {
  return state.authenticated
}

export function useMsal() {
  return {
    instance,
    accounts: state.account ? [state.account] : [],
    inProgress: "none",
  }
}

export function MsalProvider({ children }: { children: ReactNode }) {
  return children
}

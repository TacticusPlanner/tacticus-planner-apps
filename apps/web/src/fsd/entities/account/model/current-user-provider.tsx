/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"

import { useIsAuthenticated, useMsal } from "@azure/msal-react"

import { getCurrentUser, type CurrentUser } from "@/shared/auth"

export type CurrentUserState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; user: CurrentUser }
  | { status: "error"; error: unknown }

type CurrentUserContextValue = {
  state: CurrentUserState
  refetch: () => void
}

const CurrentUserContext = createContext<CurrentUserContextValue | undefined>(
  undefined
)

/**
 * Loads `/api/v1/me` once per signed-in account and shares it app-wide: the onboarding gate reads
 * `hasCompletedOnboarding`, the user menu shows the display name, and the account-management/onboarding
 * dialogs call `refetch()` after a mutation so every consumer observes the same fresh state.
 */
export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const { accounts, instance } = useMsal()
  const isAuthenticated = useIsAuthenticated()
  // `instance.getActiveAccount()` re-derives a fresh AccountInfo object from MSAL's cache on every call, so
  // it is not reliably reference-stable across renders — only `accountId` (a plain string) is safe to use in
  // dependency arrays below.
  const accountId = (instance.getActiveAccount() ?? accounts[0])?.homeAccountId
  const abortRef = useRef<AbortController | null>(null)
  // Tracks which accountId we've already kicked off a fetch for, so the effect below stays a no-op if it
  // re-runs without accountId actually changing (e.g. because `instance`/`accounts` churned by reference).
  // Without this guard the effect could re-fire on every render and send /me indefinitely.
  const fetchedAccountIdRef = useRef<string | null>(null)
  const [fetchState, setFetchState] = useState<CurrentUserState>({
    status: "idle",
  })

  // Explicit refetch (event handlers — a retry button, or a mutation's onSaved callback) always re-fetches
  // for the current account and flips to "loading" synchronously, which is safe here because this only ever
  // runs from an event handler, never from the effect below.
  const load = useCallback(() => {
    const account = instance.getActiveAccount() ?? accounts[0]
    if (!account) {
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    fetchedAccountIdRef.current = account.homeAccountId

    setFetchState({ status: "loading" })

    void getCurrentUser(instance, account, controller.signal).then(
      (user) => {
        if (controller.signal.aborted) {
          return
        }

        setFetchState({ status: "success", user })
      },
      (error: unknown) => {
        if (controller.signal.aborted) {
          return
        }

        console.error("Loading the authenticated user failed", error)
        setFetchState({ status: "error", error })
      }
    )
  }, [instance, accounts])

  // The initial/account-change fetch runs from an effect, so — unlike `load` above — its body must not call
  // setState synchronously; it only sets state from the (genuinely async) promise callbacks. It's kept as
  // its own inline fetch (not routed through `load`) specifically so this effect never calls a function that
  // contains a synchronous setState branch. The "loading" state for this path is derived at render time
  // below instead.
  useEffect(() => {
    if (!isAuthenticated || !accountId) {
      abortRef.current?.abort()
      fetchedAccountIdRef.current = null
      return
    }

    if (fetchedAccountIdRef.current === accountId) {
      return
    }

    const account = instance.getActiveAccount() ?? accounts[0]
    if (!account) {
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    fetchedAccountIdRef.current = account.homeAccountId

    void getCurrentUser(instance, account, controller.signal).then(
      (user) => {
        if (controller.signal.aborted) {
          return
        }

        setFetchState({ status: "success", user })
      },
      (error: unknown) => {
        if (controller.signal.aborted) {
          return
        }

        console.error("Loading the authenticated user failed", error)
        setFetchState({ status: "error", error })
      }
    )

    return () => controller.abort()
  }, [isAuthenticated, accountId, instance, accounts])

  const value = useMemo<CurrentUserContextValue>(() => {
    const state: CurrentUserState =
      !isAuthenticated || !accountId
        ? { status: "idle" }
        : fetchState.status === "idle"
          ? { status: "loading" }
          : fetchState

    return { refetch: load, state }
  }, [isAuthenticated, accountId, fetchState, load])

  return (
    <CurrentUserContext.Provider value={value}>
      {children}
    </CurrentUserContext.Provider>
  )
}

export function useCurrentUser() {
  const context = useContext(CurrentUserContext)

  if (context === undefined) {
    throw new Error("useCurrentUser must be used within a CurrentUserProvider")
  }

  return context
}

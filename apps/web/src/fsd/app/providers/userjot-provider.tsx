/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react"
import { useTranslation } from "react-i18next"
import { useQueryClient } from "@tanstack/react-query"
import { useIsAuthenticated } from "@azure/msal-react"

import { accountQueries, useCurrentUser } from "@/entities/account"
import { useTheme, type Theme } from "@/shared/theme"

type UserJotOpenTarget = {
  to?: "home" | "feedback" | "roadmap" | "updates"
}

const USERJOT_BOARD_URL = "https://tacticusplanner.userjot.com"
export const USERJOT_ROADMAP_URL = `${USERJOT_BOARD_URL}/roadmap`
export const USERJOT_CHANGELOG_URL = `${USERJOT_BOARD_URL}/updates`

type UserJotSdk = {
  open: (target?: UserJotOpenTarget) => void
  identify: (
    payload: { token: string } | null
  ) => Promise<{ identityTrust: "signed" | "unsigned" }>
  logout: () => void
  setTheme: (theme: "auto" | "light" | "dark") => void
  setLocale: (locale: string) => Promise<void>
  on: (event: string, handler: (payload?: unknown) => void) => () => void
}

declare global {
  interface Window {
    uj?: UserJotSdk
    /** Calls made before the SDK loaded; the SDK replays them once it runs. */
    $ujq?: unknown[][]
  }
}

// v3 is the only pin the vendor offers (accepted vendor risk; CSP limits the host).
const USERJOT_SDK_URL = "https://cdn.userjot.com/sdk/v3/uj.js"

// The vendor's queueing stub: every call made before the SDK loads is recorded and replayed by it.
// Installed at import (before any render), so the provider can call the SDK unconditionally.
if (!window.uj) {
  window.uj = new Proxy({} as UserJotSdk, {
    get: (_, method) =>
      method === "then"
        ? 0
        : (...args: unknown[]) => {
            ;(window.$ujq ||= []).push([method, ...args])
          },
  })
  ;(window.uj as unknown as { init: (...args: unknown[]) => void }).init(
    import.meta.env.VITE_USERJOT_PROJECT_ID,
    {
      widget: {
        launcher: false,
        whispers: false,
        notifications: { updates: "none" },
      },
    }
  )
}

type UserJotStatus = "idle" | "loading" | "ready" | "failed"

// Page-wide load state: one SDK script per page, shared by every consumer.
let sdkStatus: UserJotStatus = "idle"
const sdkListeners = new Set<() => void>()

function setSdkStatus(next: UserJotStatus) {
  sdkStatus = next
  sdkListeners.forEach((listener) => listener())
}

function subscribeSdkStatus(listener: () => void) {
  sdkListeners.add(listener)
  return () => {
    sdkListeners.delete(listener)
  }
}

/** Starts loading the SDK unless it is loading or loaded; a failed load is retried. */
function loadSdk() {
  if (sdkStatus === "loading" || sdkStatus === "ready") return
  setSdkStatus("loading")
  const script = document.createElement("script")
  script.type = "module"
  script.src = USERJOT_SDK_URL
  script.addEventListener("load", () => setSdkStatus("ready"))
  script.addEventListener("error", () => {
    script.remove()
    setSdkStatus("failed")
  })
  document.head.append(script)
}

const themeToUserJot: Record<Theme, "auto" | "light" | "dark"> = {
  system: "auto",
  light: "light",
  dark: "dark",
}

type UserJotContextValue = {
  /** Loads the SDK if needed; the widget opens once it has loaded. */
  open: (target?: UserJotOpenTarget) => void
  unreadCount: number
  /** `failed` when the SDK could not load: entry points disable with an explanation. */
  status: UserJotStatus
}

const UserJotContext = createContext<UserJotContextValue | undefined>(undefined)

export function UserJotProvider({ children }: { children: ReactNode }) {
  const isAuthenticated = useIsAuthenticated()
  const { state } = useCurrentUser()
  const { theme } = useTheme()
  const {
    i18n: { language },
  } = useTranslation()
  const queryClient = useQueryClient()
  const [unreadCount, setUnreadCount] = useState(0)
  const status = useSyncExternalStore(subscribeSdkStatus, () => sdkStatus)
  // Bumped at the start of every identify() call and rechecked after each await, so a slow call
  // superseded by a newer one (sign-out or a different user, mid-fetch) becomes a no-op instead of
  // applying a stale identity after the newer call already ran.
  const identifyGenerationRef = useRef(0)

  const applicationUserId =
    state.status === "success" ? state.user.applicationUserId : null
  // Not read by identify(): a confirmed-name change only needs to trigger a fresh signed token.
  const confirmedDisplayName =
    state.status === "success" ? state.user.displayName : null

  // Signed identity only — never falls back to an unsigned `identify()`, per the "verified
  // identity" requirement. A failed fetch just leaves the widget anonymous rather than blocking it.
  const identify = useCallback(async () => {
    const sdk = window.uj
    if (!sdk) {
      return
    }

    const generation = ++identifyGenerationRef.current

    if (!isAuthenticated || !applicationUserId) {
      sdk.logout()
      return
    }

    try {
      const { token } = await queryClient.fetchQuery(
        accountQueries.userJotToken()
      )
      if (identifyGenerationRef.current !== generation) {
        return
      }
      await sdk.identify({ token })
    } catch (error) {
      console.error("Failed to identify the UserJot widget.", error)
    }
  }, [isAuthenticated, applicationUserId, queryClient])

  useEffect(() => {
    void identify()
    // confirmedDisplayName: re-identify with a newly signed token after a name edit.
  }, [identify, confirmedDisplayName])

  // Tokens are capped at one hour; re-identifying on every open is simpler and more robust than a
  // background refresh timer for a widget that is only open briefly at a time.
  useEffect(() => {
    return window.uj?.on("open", () => {
      void identify()
    })
  }, [identify])

  useEffect(() => {
    window.uj?.setTheme(themeToUserJot[theme])
  }, [theme])

  useEffect(() => {
    void window.uj?.setLocale(language)
  }, [language])

  useEffect(() => {
    return window.uj?.on("unread", (payload) => {
      const count = (payload as { count?: number } | undefined)?.count
      setUnreadCount(typeof count === "number" ? count : 0)
    })
  }, [])

  // Signed-in users load it in the background after first paint (effects run after paint);
  // anonymous visitors only when they first open it.
  useEffect(() => {
    if (isAuthenticated) loadSdk()
  }, [isAuthenticated])

  const value = useMemo<UserJotContextValue>(
    () => ({
      open: (target) => {
        loadSdk()
        window.uj?.open(target)
      },
      unreadCount,
      status,
    }),
    [unreadCount, status]
  )

  return (
    <UserJotContext.Provider value={value}>{children}</UserJotContext.Provider>
  )
}

export function useUserJot() {
  const context = useContext(UserJotContext)

  if (!context) {
    throw new Error("useUserJot must be used within UserJotProvider.")
  }

  return context
}

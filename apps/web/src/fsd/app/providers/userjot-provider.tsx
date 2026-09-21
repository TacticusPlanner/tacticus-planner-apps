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
import { useTranslation } from "react-i18next"
import { useQueryClient } from "@tanstack/react-query"
import { useIsAuthenticated } from "@azure/msal-react"

import { accountQueries, useCurrentUser } from "@/entities/account"
import { useTheme, type Theme } from "@/shared/theme"

type UserJotOpenTarget = {
  to?: "home" | "feedback" | "roadmap" | "updates"
}

export const USERJOT_BOARD_URL = "https://tacticusplanner.userjot.com"

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
  }
}

const themeToUserJot: Record<Theme, "auto" | "light" | "dark"> = {
  system: "auto",
  light: "light",
  dark: "dark",
}

type UserJotContextValue = {
  open: (target?: UserJotOpenTarget) => void
  unreadCount: number
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
  // Bumped at the start of every identify() call and rechecked after each await, so a slow call
  // superseded by a newer one (sign-out or a different user, mid-fetch) becomes a no-op instead of
  // applying a stale identity after the newer call already ran.
  const identifyGenerationRef = useRef(0)

  const applicationUserId =
    state.status === "success" ? state.user.applicationUserId : null

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
  }, [identify])

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

  const value = useMemo<UserJotContextValue>(
    () => ({
      open: (target) => window.uj?.open(target),
      unreadCount,
    }),
    [unreadCount]
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

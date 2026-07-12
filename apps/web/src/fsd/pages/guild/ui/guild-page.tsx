import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"

import { useMsal } from "@azure/msal-react"

import { getMyGuild, type MyGuildResponse } from "@/entities/guild"
import { ApiError } from "@/shared/api"

import { GuildRegisteredView } from "./guild-registered-view"
import { GuildRegistrationForm } from "./guild-registration-form"
import { GuildTacticusUserIdCard } from "./guild-tacticus-user-id-card"

type FetchState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success"; data: MyGuildResponse }

/**
 * Guild page: loads GET /api/v1/guilds/me once on open (read persisted state only — no automatic
 * synchronization, per the Guild Phase 1 spec) and renders one of three states from its discriminator.
 * Each child view's `onSaved`/`onRegistered`/`onSynced` callback re-runs `load` so the page always
 * reflects fresh persisted state after a mutation, without a separate cache to invalidate.
 */
export function GuildPage() {
  const { t } = useTranslation()
  const { instance, accounts } = useMsal()
  const account = instance.getActiveAccount() ?? accounts[0]
  // `instance.getActiveAccount()` re-derives a fresh AccountInfo object from MSAL's cache on every call, so
  // it is not reference-stable across renders — only `accountId` (a plain string) is safe to use in the
  // mount effect's dependency array below (mirrors CurrentUserProvider).
  const accountId = account?.homeAccountId
  const abortRef = useRef<AbortController | null>(null)
  const [fetchState, setFetchState] = useState<FetchState>({ status: "idle" })

  // Explicit reload (retry button, or a child view's onSaved/onRegistered/onSynced) always re-fetches and
  // flips to "loading" synchronously — safe here because this only ever runs from an event handler, never
  // from the effect below (see the guard against setState-in-effect below).
  const load = useCallback(() => {
    if (!account) {
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setFetchState({ status: "idle" })

    void getMyGuild(instance, account, controller.signal).then(
      (data) => {
        if (controller.signal.aborted) {
          return
        }

        setFetchState({ status: "success", data })
      },
      (error: unknown) => {
        if (controller.signal.aborted) {
          return
        }

        setFetchState({
          status: "error",
          message:
            error instanceof ApiError ? error.message : t("guild.loadError"),
        })
      }
    )
    // t is stable from i18next and intentionally excluded — including it would re-create this callback on
    // every language change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instance, account])

  // The initial/account-change fetch runs from an effect, so — unlike `load` above — its body must not
  // call setState synchronously; only the (genuinely async) promise callbacks do. Kept as its own inline
  // fetch rather than calling `load()` so this effect never invokes a function with a synchronous setState
  // branch (mirrors CurrentUserProvider's mount effect).
  //
  // Guards result application with a per-invocation `active` flag instead of a cross-invocation ref (see
  // game-catalog-provider.tsx): StrictMode double-invokes this effect (mount, cleanup, mount again) before
  // the async `getMyGuild` call ever reaches its first `await`, so a ref that's set synchronously and only
  // reset on unmount would still read as "already fetched" on the second invocation — skipping it entirely
  // while the first invocation's request was aborted before any request was even sent.
  useEffect(() => {
    const currentAccount = instance.getActiveAccount() ?? accounts[0]
    if (!currentAccount) {
      return
    }

    let active = true
    const controller = new AbortController()
    abortRef.current = controller

    void getMyGuild(instance, currentAccount, controller.signal).then(
      (data) => {
        if (!active) {
          return
        }

        setFetchState({ status: "success", data })
      },
      (error: unknown) => {
        if (!active) {
          return
        }

        setFetchState({
          status: "error",
          message:
            error instanceof ApiError ? error.message : t("guild.loadError"),
        })
      }
    )

    return () => {
      active = false
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId, instance, accounts])

  const isLoading = useMemo(
    () => fetchState.status === "idle",
    [fetchState.status]
  )

  return (
    <main
      className="mx-auto flex w-full max-w-400 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10"
      data-testid="guild-page"
    >
      {isLoading ? (
        <div className="flex flex-col gap-3" data-testid="guild-page-loading">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : null}

      {fetchState.status === "error" ? (
        <div
          className="flex flex-col items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm"
          data-testid="guild-page-error"
          role="alert"
        >
          <p className="text-destructive">{fetchState.message}</p>
          <Button onClick={load} size="sm" variant="outline">
            {t("guild.retry")}
          </Button>
        </div>
      ) : null}

      {fetchState.status === "success" &&
      fetchState.data.state === "tacticusUserIdRequired" ? (
        <GuildTacticusUserIdCard onSaved={load} />
      ) : null}

      {fetchState.status === "success" &&
      fetchState.data.state === "unregistered" ? (
        <GuildRegistrationForm onRegistered={load} />
      ) : null}

      {fetchState.status === "success" &&
      fetchState.data.state === "registered" &&
      fetchState.data.guild ? (
        <GuildRegisteredView
          guild={fetchState.data.guild}
          onSynced={load}
          onPurged={load}
        />
      ) : null}
    </main>
  )
}

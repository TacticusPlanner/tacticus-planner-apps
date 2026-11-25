import { useMemo } from "react"
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import type { QueryClient } from "@tanstack/react-query"

import {
  createAttack,
  deleteAttack,
  setCurrentWar,
  startWar,
} from "../api/guild-war.api"
import { guildWarQueries } from "../api/guild-war.queries"
import { isGuildWarNotStarted, staleGuildWar } from "./guild-war-errors"
import type { GuildWar, GuildWarAttackFields, GuildWarSettings } from "./types"

/** The caller's current war (null when there is none). */
export function useCurrentGuildWar() {
  return useQuery(guildWarQueries.current())
}

/** The ended wars loaded so far, newest first, and the next (older) page on demand. */
export function usePastGuildWars() {
  const query = useInfiniteQuery(guildWarQueries.past())
  const wars = useMemo(
    () => query.data?.pages.flatMap((page) => page.items),
    [query.data]
  )
  return {
    wars,
    isPending: query.isPending,
    isError: query.isError,
    refetch: query.refetch,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
  }
}

const currentKey = () => guildWarQueries.current().queryKey

/** Puts a war the API answered into the cache: the current one, else a past one (refetched). */
function adoptWar(client: QueryClient, war: GuildWar) {
  if (war.endedAt === null) {
    client.setQueryData(currentKey(), war)
  } else {
    void client.invalidateQueries({ queryKey: guildWarQueries.past().queryKey })
  }
}

/** Refetches the current war in the background: a save resolves as soon as the API answers it. */
function refresh(client: QueryClient) {
  void client.invalidateQueries({ queryKey: currentKey() })
}

/** Saves the season and battlefield level, creating the current war when there is none. A stale
 *  save adopts the war as it stands, so the dialog can show it. */
export function useSetGuildWarSettings() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({
      settings,
      revision,
    }: {
      settings: GuildWarSettings
      revision: number
    }) => setCurrentWar(settings, revision),
    onSuccess: (war) => adoptWar(client, war),
    onError: (error) => {
      const current = staleGuildWar(error)
      if (current) adoptWar(client, current)
    },
    onSettled: () => refresh(client),
  })
}

/** Ends the current war, keeping it in History, and starts a new one. A start the server finds
 *  stale (the war it would end is no longer current, e.g. a retried start) adopts the current war. */
export function useStartGuildWar() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({
      settings,
      currentWarId,
    }: {
      settings: GuildWarSettings
      currentWarId: string | null
    }) => startWar(settings, currentWarId),
    onSuccess: (war) => {
      client.setQueryData(currentKey(), war)
      void client.invalidateQueries({
        queryKey: guildWarQueries.past().queryKey,
      })
    },
    onError: (error) => {
      const current = staleGuildWar(error)
      if (current) adoptWar(client, current)
    },
    onSettled: () => refresh(client),
  })
}

/**
 * Logs an attack in the current war. With no current war the first attack starts one with
 * `settings` (the season and level the page shows), then logs the attack in it.
 */
export function useLogGuildWarAttack() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async ({
      fields,
      settings,
    }: {
      fields: GuildWarAttackFields
      settings: GuildWarSettings
    }) => {
      try {
        return await createAttack(fields)
      } catch (error) {
        if (!isGuildWarNotStarted(error)) throw error
        try {
          await setCurrentWar(settings, 0)
        } catch (startError) {
          // Another tab or device started the war in between: log the attack in that one.
          if (!staleGuildWar(startError)) throw startError
        }
        return createAttack(fields)
      }
    },
    onSuccess: (war) => adoptWar(client, war),
    onSettled: () => refresh(client),
  })
}

/** Removes an attack (Undo), freeing its units and token. */
export function useUndoGuildWarAttack() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ warId, attackId }: { warId: string; attackId: string }) =>
      deleteAttack(warId, attackId),
    onSuccess: (war) => adoptWar(client, war),
    onSettled: () => refresh(client),
  })
}

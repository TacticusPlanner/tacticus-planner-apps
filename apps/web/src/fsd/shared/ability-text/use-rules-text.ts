import { useCallback, useEffect, useMemo, useReducer } from "react"
import { useTranslation } from "react-i18next"
import type { i18n as I18n } from "i18next"

/** Rules text for a set of ids, loaded after the page paints (never suspends). */
export type RulesText<Entry> = {
  /** Every requested namespace has settled (loaded or failed). */
  ready: boolean
  /** A requested namespace settled without any resources, in the active language or English. */
  failed: boolean
  /** Request the namespaces again. */
  retry: () => void
  /** The id's entry in the active language, falling back to English; undefined while loading. */
  text: (id: string) => Entry | undefined
}

/** Whether a rules-text slot shows a status instead of text: still loading, or failed. */
export const rulesTextPending = (rules: RulesText<unknown>) =>
  !rules.ready || rules.failed

/**
 * i18next never re-reads a namespace whose load failed: its backend connector keeps state -1, which
 * `reloadResources` skips too. Forgetting those failures makes the next `loadNamespaces` read again.
 */
function forgetFailedLoads(i18n: I18n, namespaces: readonly string[]) {
  const { state } = i18n.services.backendConnector as {
    state?: Record<string, number | undefined>
  }
  if (!state) return
  for (const lng of i18n.languages) {
    for (const namespace of namespaces) {
      if (state[`${lng}|${namespace}`] === -1)
        state[`${lng}|${namespace}`] = undefined
    }
  }
}

/**
 * Loads i18next namespaces on demand without Suspense. i18next counts a failed download as
 * "loaded", so `failed` is derived from the store: a settled namespace with no bundle in any of the
 * active languages failed (namespaces known to have no file are never requested, see `gaps`).
 */
function useNamespaces(namespaces: readonly string[]) {
  const { i18n } = useTranslation()
  const [, rerender] = useReducer((count: number) => count + 1, 0)
  const key = namespaces.join("\n")
  const list = useMemo(() => (key ? key.split("\n") : []), [key])

  const ready = list.every((namespace) => i18n.hasLoadedNamespace(namespace))
  const failed =
    ready &&
    list.some(
      (namespace) =>
        !i18n.languages.some((lng) => i18n.hasResourceBundle(lng, namespace))
    )

  useEffect(() => {
    if (!ready) void i18n.loadNamespaces(list).then(rerender)
  }, [i18n, list, ready])

  const retry = useCallback(() => {
    forgetFailedLoads(i18n, list)
    rerender()
  }, [i18n, list])

  return { ready, failed, retry }
}

/**
 * Rules text from an id-keyed game-data namespace. With `ids`, each id is its own namespace
 * (`<namespace>/<id>`, one small file per id) and only those are fetched; ids listed in the `gaps`
 * namespace (generated alongside, English) have no file, so they are never requested and read as
 * missing text. Without `ids` the whole namespace is loaded.
 */
export function useRulesText<Entry>({
  namespace,
  gaps,
  ids,
}: {
  namespace: string
  gaps?: string
  ids?: readonly string[]
}): RulesText<Entry> {
  const { i18n } = useTranslation()
  const gapList = useNamespaces(gaps ? [gaps] : [])
  const gapIds =
    gaps && gapList.ready
      ? new Set(
          Object.values(
            (i18n.getResourceBundle("en", gaps) ?? {}) as Record<string, string>
          )
        )
      : undefined
  const requested = ids
    ? gaps && !gapIds
      ? []
      : [...new Set(ids)]
          .filter((id) => !gapIds?.has(id))
          .map((id) => `${namespace}/${id}`)
    : [namespace]
  const loaded = useNamespaces(requested)

  const read = (ns: string, id: string) =>
    (i18n.getResource(i18n.language, ns, id) ??
      i18n.getResource("en", ns, id)) as Entry | undefined

  return {
    ready: gapList.ready && loaded.ready,
    failed: gapList.failed || loaded.failed,
    retry: gapList.failed ? gapList.retry : loaded.retry,
    text: (id) => read(ids ? `${namespace}/${id}` : namespace, id),
  }
}

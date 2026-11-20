import { useEffect, useMemo } from "react"
import { useLocation, useNavigate } from "react-router"

function withoutLegacyCharacter(search: string) {
  const params = new URLSearchParams(search)
  params.delete("character")
  const next = params.toString()
  return next ? `?${next}` : ""
}

/**
 * Keeps a Library collection's selected entity in its URL path. Automatic
 * canonicalization replaces history; explicit selection remains navigable by
 * browser back/forward.
 */
export function useLibraryRouteSelection({
  collectionPath,
  entityId,
  entityIds,
  loading,
}: {
  collectionPath: string
  entityId?: string
  entityIds: readonly string[] | undefined
  loading: boolean
}) {
  const location = useLocation()
  const navigate = useNavigate()
  const search = useMemo(
    () => withoutLegacyCharacter(location.search),
    [location.search]
  )
  const selectedId =
    entityId && entityIds?.includes(entityId)
      ? entityId
      : !loading
        ? entityIds?.[0]
        : undefined

  useEffect(() => {
    if (loading || entityIds === undefined) return

    const firstId = entityIds[0]
    const canonicalPath = firstId
      ? `${collectionPath}/${selectedId ?? firstId}`
      : collectionPath
    const hasCanonicalPath = location.pathname === canonicalPath
    const hasCanonicalSearch = location.search === search

    if (!hasCanonicalPath || !hasCanonicalSearch) {
      void navigate({ pathname: canonicalPath, search }, { replace: true })
    }
  }, [
    collectionPath,
    entityIds,
    loading,
    location.pathname,
    location.search,
    navigate,
    search,
    selectedId,
  ])

  const select = (id: string) => {
    void navigate({ pathname: `${collectionPath}/${id}`, search })
  }
  const clear = () => {
    void navigate({ pathname: collectionPath, search })
  }

  return { clear, select, selectedId }
}

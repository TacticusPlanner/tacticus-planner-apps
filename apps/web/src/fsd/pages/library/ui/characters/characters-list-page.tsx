import { useEffect, useMemo, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router"
import { useTranslation } from "react-i18next"
import { Search } from "lucide-react"
import { characterIcon, factionIcon } from "@workspace/game-catalog"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"

import { EntityIcon } from "@/shared/ui"
import { useTourPageSteps } from "@/shared/tour"

import { unitOriginState } from "../unit/unit-origin"
import { useCharactersListTutorial } from "./characters-list.tutorial"
import { searchCharacters } from "./characters-list.view-model"
import { useCharacterListItems } from "./use-character-list-items"
import { useCharactersCatalog } from "./use-characters-catalog"

const COLLECTION_PATH = "/library/characters"

/**
 * `/library/characters`: every character as a tile with name search. A tile opens the character's
 * unit page and hands it the list's current order for prev/next.
 */
export function CharactersListPage() {
  const { t, i18n } = useTranslation("library")
  const location = useLocation()
  const navigate = useNavigate()
  const catalog = useCharactersCatalog()
  const items = useCharacterListItems(catalog.characters)
  const [query, setQuery] = useState("")
  const listed = useMemo(
    () => searchCharacters(items, query, i18n.language),
    [items, query, i18n.language]
  )
  const origin = useMemo(
    () => unitOriginState({ kind: "list", ids: listed.map((item) => item.id) }),
    [listed]
  )

  useTourPageSteps(useCharactersListTutorial())

  // The former calculator lived here and kept its range in the query; a link without a character
  // has no use for it.
  useEffect(() => {
    if (location.search) {
      void navigate(
        { pathname: COLLECTION_PATH, search: "" },
        { replace: true }
      )
    }
  }, [location.search, navigate])

  if (catalog.status === "loading") {
    return (
      <p className="text-muted-foreground" data-testid="characters-loading">
        {t("loading")}
      </p>
    )
  }
  if (catalog.status === "failed") {
    return (
      <div className="flex flex-col items-start gap-3">
        <p data-testid="characters-load-failed">{t("unit.loadFailed")}</p>
        <Button variant="outline" onClick={catalog.retry}>
          {t("unit.retry")}
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4" data-testid="characters-list-page">
      <h1 className="sr-only">{t("charactersList.title")}</h1>
      <label className="relative max-w-sm" data-testid="characters-search">
        <span className="sr-only">{t("charactersList.search")}</span>
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("charactersList.searchPlaceholder")}
          className="pl-8"
        />
      </label>

      {listed.length === 0 ? (
        <div
          className="flex flex-col items-center gap-4 py-10 text-center text-muted-foreground"
          data-testid="characters-no-matching"
        >
          <p>
            {items.length === 0
              ? t("collections.noRecords")
              : t("charactersList.noMatching")}
          </p>
          {items.length > 0 ? (
            <Button variant="outline" onClick={() => setQuery("")}>
              {t("charactersList.clearSearch")}
            </Button>
          ) : null}
        </div>
      ) : (
        <ul
          className="flex flex-wrap gap-2"
          aria-label={t("charactersList.title")}
          data-testid="characters-list"
        >
          {listed.map((item) => {
            const emblem = factionIcon(item.factionId)
            return (
              <li key={item.id}>
                <Link
                  to={`${COLLECTION_PATH}/${item.id}`}
                  state={origin}
                  title={`${item.name} · ${item.factionName}`}
                  className="flex w-24 flex-col items-center gap-1.5 rounded-lg border p-2 text-center transition-colors hover:bg-accent/10 focus-visible:outline-2 focus-visible:outline-primary"
                  data-testid={`character-tile-${item.id}`}
                >
                  <span className="relative">
                    <EntityIcon
                      src={characterIcon(item.id)}
                      alt=""
                      className="size-14 rounded-full bg-muted"
                    />
                    {emblem ? (
                      <EntityIcon
                        src={emblem}
                        alt={item.factionName}
                        className="absolute -right-1 -bottom-1 size-5 rounded-full bg-background p-0.5"
                      />
                    ) : null}
                  </span>
                  <span className="line-clamp-2 text-xs font-medium">
                    {item.name}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

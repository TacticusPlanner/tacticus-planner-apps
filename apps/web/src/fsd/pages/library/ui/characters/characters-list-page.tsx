import { useEffect } from "react"
import { useLocation, useNavigate } from "react-router"
import { useTranslation } from "react-i18next"
import { characterIcon } from "@workspace/game-catalog"
import { Button } from "@workspace/ui/components/button"

import { useTourPageSteps } from "@/shared/tour"

import { UnitList } from "../unit/unit-list"
import { useCharactersListTutorial } from "./characters-list.tutorial"
import { useCharacterListItems } from "./use-character-list-items"
import { useCharactersCatalog } from "./use-characters-catalog"

const COLLECTION_PATH = "/library/characters"

/**
 * `/library/characters`: every character as a tile with name search. A tile opens the character's
 * unit page and hands it the list's current order for prev/next.
 */
export function CharactersListPage() {
  const { t } = useTranslation("library")
  const location = useLocation()
  const navigate = useNavigate()
  const catalog = useCharactersCatalog()
  const items = useCharacterListItems(catalog.characters)

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
      <UnitList
        items={items}
        iconFor={characterIcon}
        basePath={COLLECTION_PATH}
        testIdPrefix="characters"
        tileTestIdPrefix="character-tile"
        labels={{
          title: t("charactersList.title"),
          search: t("charactersList.search"),
          searchPlaceholder: t("charactersList.searchPlaceholder"),
          noMatching: t("charactersList.noMatching"),
          clearSearch: t("charactersList.clearSearch"),
        }}
      />
    </div>
  )
}

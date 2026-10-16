import { useTranslation } from "react-i18next"
import { mowIcon } from "@workspace/game-catalog"
import { Button } from "@workspace/ui/components/button"

import { useTourPageSteps } from "@/shared/tour"

import { UnitList } from "../unit/unit-list"
import { useMowsListTutorial } from "./mows-list.tutorial"
import { useMowListItems, useMowsCatalog } from "./use-mows-catalog"

export const MOWS_PATH = "/library/machines-of-war"

/**
 * `/library/machines-of-war`: every Machine of War as a tile with name search. A tile opens the MoW's
 * unit page and hands it the list's current order for prev/next.
 */
export function MowsListPage() {
  const { t } = useTranslation("library")
  const catalog = useMowsCatalog()
  const items = useMowListItems(catalog.records)

  useTourPageSteps(useMowsListTutorial())

  if (catalog.status === "loading") {
    return (
      <p className="text-muted-foreground" data-testid="mows-loading">
        {t("loading")}
      </p>
    )
  }
  if (catalog.status === "failed") {
    return (
      <div className="flex flex-col items-start gap-3">
        <p data-testid="mows-load-failed">{t("unit.loadFailed")}</p>
        <Button variant="outline" onClick={catalog.retry}>
          {t("unit.retry")}
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4" data-testid="mows-list-page">
      <h1 className="sr-only">{t("mowsList.title")}</h1>
      <UnitList
        items={items}
        iconFor={mowIcon}
        basePath={MOWS_PATH}
        testIdPrefix="mows"
        tileTestIdPrefix="mow-tile"
        labels={{
          title: t("mowsList.title"),
          search: t("mowsList.search"),
          searchPlaceholder: t("charactersList.searchPlaceholder"),
          noMatching: t("mowsList.noMatching"),
          clearSearch: t("charactersList.clearSearch"),
        }}
      />
    </div>
  )
}

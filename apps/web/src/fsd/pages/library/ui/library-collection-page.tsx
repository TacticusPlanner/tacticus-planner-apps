import { useParams } from "react-router"
import { useTranslation } from "react-i18next"
import { useLiveQuery } from "dexie-react-hooks"

import { useLibraryRouteSelection } from "../model/use-library-route-selection"

type LibraryRecord = { id: string; name: string }

export function LibraryCollectionPage({
  collection,
  getRecords,
}: {
  collection: "machines-of-war" | "npcs"
  getRecords: () => Promise<LibraryRecord[]>
}) {
  const { t } = useTranslation("library")
  const { entityId } = useParams()
  const records = useLiveQuery(getRecords, [])
  useLibraryRouteSelection({
    collectionPath: `/library/${collection}`,
    entityId,
    entityIds: records?.map((record) => record.id),
    loading: records === undefined,
  })

  if (records === undefined) {
    return <p className="text-muted-foreground">{t("loading")}</p>
  }

  if (records.length === 0) {
    return (
      <p className="py-10 text-center text-muted-foreground">
        {t("collections.noRecords")}
      </p>
    )
  }

  const collectionLabelKey =
    collection === "machines-of-war"
      ? "collections.machinesOfWar.label"
      : "collections.npcs.label"

  return (
    <p
      className="py-10 text-center text-muted-foreground"
      data-testid={`${collection}-library-page`}
    >
      {t("collections.detailUnavailable", {
        name: t(collectionLabelKey),
      })}
    </p>
  )
}

export function LibraryNoRecordsPage() {
  const { t } = useTranslation("library")
  const { entityId } = useParams()
  useLibraryRouteSelection({
    collectionPath: "/library/raid-bosses",
    entityId,
    entityIds: [],
    loading: false,
  })

  return (
    <p
      className="py-10 text-center text-muted-foreground"
      data-testid="raid-bosses-library-page"
    >
      {t("collections.raidBossesNoRecords")}
    </p>
  )
}

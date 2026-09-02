import { useParams } from "react-router"
import { useTranslation } from "react-i18next"
import { useLiveQuery } from "dexie-react-hooks"
import { Button } from "@workspace/ui/components/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

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
  const selection = useLibraryRouteSelection({
    collectionPath: `/library/${collection}`,
    entityId,
    entityIds: records?.map((record) => record.id),
    loading: records === undefined,
  })
  const selected = records?.find((record) => record.id === selection.selectedId)

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

  return (
    <section
      className="flex max-w-xl flex-col gap-4"
      data-testid={`${collection}-library-page`}
    >
      <label className="grid gap-2">
        <span className="font-medium">{t("selector.label")}</span>
        <Select value={selection.selectedId} onValueChange={selection.select}>
          <SelectTrigger aria-label={t("selector.label")} className="w-full">
            <SelectValue placeholder={t("selector.placeholder")} />
          </SelectTrigger>
          <SelectContent>
            {records.map((record) => (
              <SelectItem key={record.id} value={record.id}>
                {record.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
      {selected ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border p-4">
          <p>{t("selector.selected", { name: selected.name })}</p>
          <Button onClick={selection.clear} variant="outline">
            {t("selector.clear")}
          </Button>
        </div>
      ) : null}
    </section>
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

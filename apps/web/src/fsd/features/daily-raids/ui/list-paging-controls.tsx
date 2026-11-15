import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"

import type { ListPaging } from "../model/use-list-paging"

/** "Show next 5" and "Show all (N)" under a paged raid list; nothing once every row shows. */
export function ListPagingControls({
  paging,
  testId,
}: {
  paging: Pick<ListPaging, "hidden" | "next" | "total" | "showNext" | "showAll">
  testId: string
}) {
  const { t } = useTranslation("dailies")
  if (paging.hidden <= 0) return null
  return (
    <div className="flex flex-wrap gap-2" data-testid={testId}>
      <Button
        data-testid={`${testId}-next`}
        onClick={paging.showNext}
        size="sm"
        variant="outline"
      >
        {t("listPaging.showNext", { count: paging.next })}
      </Button>
      <Button
        data-testid={`${testId}-all`}
        onClick={paging.showAll}
        size="sm"
        variant="ghost"
      >
        {t("listPaging.showAll", { count: paging.total })}
      </Button>
    </div>
  )
}

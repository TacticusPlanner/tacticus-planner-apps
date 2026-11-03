import { useTranslation } from "react-i18next"

import type { SourceLabels } from "./compare-labels"

/** The translated copy `sourceLabel` and `snapshotLabel` build labels from. */
export function useSourceLabels(): SourceLabels {
  const { t } = useTranslation("common")
  return {
    runRecord: (values) =>
      t("myGame.collection.compare.runRecordLabel", values),
    auto: (date) => t("myGame.collection.snapshots.autoLabel", { date }),
    v1Import: (name) =>
      t("myGame.collection.snapshots.v1ImportLabel", { name }),
  }
}

import { useTranslation } from "react-i18next"

import {
  hasPendingChanges,
  type MembershipDraft,
} from "../model/membership-draft"

/** The named summary of what Save will do — every pending addition and removal, regardless of what the
 * search or grouping currently shows. */
export function MembershipReview({
  draft,
  goalName,
}: {
  draft: MembershipDraft
  goalName: (goalId: string) => string
}) {
  const { t } = useTranslation()
  return (
    <section
      aria-live="polite"
      className="grid max-h-40 gap-1 overflow-y-auto text-sm"
      data-testid="add-goals-review"
    >
      <h3 className="font-medium">{t("goals.project.assemblyReviewTitle")}</h3>
      {hasPendingChanges(draft) ? (
        <>
          {draft.adds.length > 0 ? (
            <div data-testid="add-goals-review-adds">
              <p className="text-muted-foreground">
                {t("goals.project.assemblyReviewAdding", {
                  total: draft.adds.length,
                })}
              </p>
              <ul className="list-disc pl-5">
                {draft.adds.map((goalId) => (
                  <li key={goalId}>{goalName(goalId)}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {draft.removes.length > 0 ? (
            <div data-testid="add-goals-review-removes">
              <p className="text-muted-foreground">
                {t("goals.project.assemblyReviewRemoving", {
                  total: draft.removes.length,
                })}
              </p>
              <ul className="list-disc pl-5">
                {draft.removes.map((goalId) => (
                  <li key={goalId}>{goalName(goalId)}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      ) : (
        <p className="text-muted-foreground">
          {t("goals.project.assemblyReviewEmpty")}
        </p>
      )}
    </section>
  )
}

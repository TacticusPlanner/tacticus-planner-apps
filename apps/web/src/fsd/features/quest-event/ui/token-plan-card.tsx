import { useTranslation } from "react-i18next"

import { NumberStepper } from "@/shared/ui"

import type { QuestTokenPlan, QuestTokens } from "../model/quest-token-plan"

/**
 * The attempts left against the battles still below their maximum (spec: quest-event-token-plan),
 * with the optional "tokens now" entry on a running quest and the bank-full warning. A claim window
 * says battles are closed; a preview gives the attempts a full quest offers.
 */
export function TokenPlanCard({
  plan,
  tokens,
  onTokensChange,
}: {
  plan: QuestTokenPlan
  tokens: QuestTokens | null
  /** Records the entry now; null clears it. Null when the entry is not offered. */
  onTokensChange: ((count: number | null) => void) | null
}) {
  const { t, i18n } = useTranslation("quest")
  const number = new Intl.NumberFormat(i18n.language)
  const time = (ms: number) =>
    new Date(ms).toLocaleTimeString(i18n.language, { timeStyle: "short" })
  return (
    <section
      aria-labelledby="quest-tokens-title"
      className="flex min-w-0 flex-col gap-2 rounded-xl border p-4"
      data-testid="quest-tokens"
    >
      <h3 className="font-semibold" id="quest-tokens-title">
        {t("tokens.title")}
      </h3>
      {plan.kind === "closed" ? (
        <p className="text-sm">{t("tokens.closed")}</p>
      ) : plan.kind === "preview" ? (
        <p className="text-sm" data-testid="quest-tokens-preview">
          {t("tokens.preview", { attempts: number.format(plan.attempts) })}
        </p>
      ) : (
        <>
          {onTokensChange ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">{t("tokens.now")}</span>
              <NumberStepper
                clearable
                labels={{
                  value: t("tokens.now"),
                  decrease: t("tokens.nowDecrease"),
                  increase: t("tokens.nowIncrease"),
                  clear: t("tokens.clear"),
                }}
                max={plan.bankMax}
                min={0}
                onChange={onTokensChange}
                touch
                value={tokens?.count ?? null}
              />
              {tokens ? (
                <span
                  className="text-sm text-muted-foreground"
                  data-testid="quest-tokens-as-of"
                >
                  {t("tokens.asOf", {
                    count: tokens.count,
                    time: time(Date.parse(tokens.atUtc)),
                  })}
                </span>
              ) : null}
            </div>
          ) : null}
          <p className="text-sm" data-testid="quest-tokens-plan">
            {plan.battlesToImprove === 0 ? (
              t("tokens.perfect")
            ) : (
              <>
                {t("tokens.attempts", {
                  attempts: number.format(plan.attempts),
                  battles: number.format(plan.battlesToImprove),
                })}
                {plan.assumedFull ? ` (${t("tokens.assumed")})` : null}
                {" · "}
                {plan.spare >= 0
                  ? t("tokens.spare", { count: plan.spare })
                  : t("tokens.short", { count: -plan.spare })}
              </>
            )}
          </p>
          {plan.bankFullMs !== null ? (
            <p
              className="text-sm text-amber-700 dark:text-amber-400"
              data-testid="quest-tokens-bank-full"
            >
              {t("tokens.bankFull", { time: time(plan.bankFullMs) })}
            </p>
          ) : null}
          <p className="text-xs text-muted-foreground">{t("tokens.tip")}</p>
        </>
      )}
    </section>
  )
}

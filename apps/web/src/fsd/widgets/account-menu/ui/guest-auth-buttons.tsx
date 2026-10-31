import { LogIn, UserPlus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"

import { useSignInRedirect } from "@/shared/auth"

/** The signed-out visitor's Sign in and Sign up actions, side by side in a top bar. Disabled while an
 *  MSAL interaction is running; Sign in reads "checking" while the silent restore runs. */
export function GuestAuthButtons() {
  const { t } = useTranslation()
  const { checkingSignIn, disabled, signIn, signUp } = useSignInRedirect()

  return (
    <div className="flex min-w-0 items-center gap-2">
      {/* min-w-0 + truncate: the long "signing you in" label must not push Sign up off the bar. */}
      <Button
        className="min-w-0"
        data-testid="auth-sign-in"
        disabled={disabled}
        onClick={signIn}
        size="sm"
        variant="ghost"
      >
        <LogIn data-icon="inline-start" />
        <span className="truncate">
          {checkingSignIn ? t("auth.checkingSignIn") : t("auth.signIn")}
        </span>
      </Button>
      <Button
        data-testid="auth-sign-up"
        disabled={disabled}
        onClick={signUp}
        size="sm"
      >
        <UserPlus data-icon="inline-start" />
        {t("auth.signUp")}
      </Button>
    </div>
  )
}

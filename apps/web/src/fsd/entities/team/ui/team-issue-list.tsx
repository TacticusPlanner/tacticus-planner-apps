import { cn } from "@workspace/ui/lib/utils"

import type { TeamRuleInput } from "../lib/team-rules"
import { useTeamRuleText } from "../model/use-team-copy"
import type { TeamRuleCode } from "../model/types"

/** Each broken rule's translated reason and how to fix it, never a raw code. */
export function TeamIssueList({
  codes,
  team,
  className,
  testId,
}: {
  codes: readonly TeamRuleCode[]
  /** Sizes counted fixes ("Make 1 character flex"). */
  team?: Pick<
    TeamRuleInput,
    "characterIds" | "flexStartIndex" | "mowIds" | "mowFlexStartIndex"
  >
  className?: string
  testId?: string
}) {
  const ruleText = useTeamRuleText()
  if (codes.length === 0) return null
  return (
    <ul
      className={cn("flex flex-col gap-1 text-sm", className)}
      data-testid={testId}
    >
      {codes.map((code) => {
        const text = ruleText(code, team)
        return (
          <li data-rule={code} key={code}>
            {text.reason} <span className="font-medium">{text.fix}</span>
          </li>
        )
      })}
    </ul>
  )
}

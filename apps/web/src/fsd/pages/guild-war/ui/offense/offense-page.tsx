import { useGuildWarTutorial } from "../guild-war.tutorial"
import { WarSummary } from "./war-summary"

/** Guild War Offense: the current war's summary, teams, units and attack log. */
export function OffensePage() {
  useGuildWarTutorial("offense")
  return (
    <div className="flex flex-col gap-5" data-testid="guild-war-offense">
      <WarSummary />
    </div>
  )
}

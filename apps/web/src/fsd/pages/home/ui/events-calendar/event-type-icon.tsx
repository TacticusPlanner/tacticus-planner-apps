import {
  Calendar,
  Compass,
  Flag,
  Rocket,
  ShieldAlert,
  Star,
  Trophy,
  UserPlus,
  Zap,
  type LucideIcon,
} from "lucide-react"

// Id-based icon resolution keyed by the definition's structural `type` field (not its specific `id`,
// since every definition of a given type shares the same visual language) — no icon asset exists for
// event content yet, so this is a small, generic set rather than per-definition artwork.
const iconByDefinitionType: Record<string, LucideIcon> = {
  CampaignEvent: Compass,
  Incursion: ShieldAlert,
  LegendaryEvent: Star,
  StandingModifier: Zap,
  NewCharacterEvent: UserPlus,
  GameVersionRelease: Rocket,
  HomeScreenEvent: Flag,
  TournamentArena: Trophy,
}

export function EventTypeIcon({
  definitionType,
  className,
}: {
  definitionType: string | undefined
  className?: string
}) {
  const Icon: LucideIcon =
    (definitionType && iconByDefinitionType[definitionType]) || Calendar

  return <Icon className={className} />
}

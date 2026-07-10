import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Badge } from "@workspace/ui/components/badge"
import { Card, CardContent, CardHeader } from "@workspace/ui/components/card"

import {
  characterIcon,
  damageTypeIcon,
  equipmentSlotIcon,
  statIcon,
  traitIcon,
} from "@workspace/game-catalog"

import { EntityIcon } from "@/shared/ui"

import type {
  UnitProfileViewModel,
  UnitStatPair,
} from "./unit-profile.view-model"

export function UnitProfile({ profile }: { profile: UnitProfileViewModel }) {
  const { t } = useTranslation(["common", "traits", "damageTypes", "equipment"])

  return (
    <Card className="gap-4 py-4" data-testid="unit-profile">
      <CardHeader className="flex flex-row items-center gap-3 px-4">
        <EntityIcon
          src={characterIcon(profile.id)}
          alt=""
          className="size-16 shrink-0 rounded-full"
        />
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold">{profile.name}</p>
          <p className="truncate text-sm text-muted-foreground">
            {profile.faction}
          </p>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 px-4">
        <div className="flex flex-wrap gap-6">
          <StatRow
            icon={statIcon("movement")}
            label={t("unitLookup.movement")}
            value={String(profile.movement)}
          />
          <StatRow
            icon={statIcon("melee")}
            label={t("unitLookup.melee")}
            value={String(profile.meleeHits)}
          >
            <DamageTypeChip type={profile.meleeDamageType} />
          </StatRow>
          {profile.rangedHits != null ? (
            <StatRow
              icon={statIcon("ranged")}
              label={t("unitLookup.ranged")}
              value={
                profile.rangeDistance != null
                  ? `${profile.rangedHits} (${profile.rangeDistance})`
                  : String(profile.rangedHits)
              }
            >
              {profile.rangedDamageType ? (
                <DamageTypeChip type={profile.rangedDamageType} />
              ) : null}
            </StatRow>
          ) : null}
        </div>

        {profile.damageTypes.length > 0 ? (
          <ProfileSection label={t("unitLookup.damageTypes")}>
            {profile.damageTypes.map((type) => (
              <DamageTypeChip key={type} type={type} />
            ))}
          </ProfileSection>
        ) : null}

        {profile.equipmentSlots.length > 0 ? (
          <ProfileSection label={t("unitLookup.equipment")}>
            {profile.equipmentSlots.map((slot, index) => (
              <Badge
                key={`${slot}-${index}`}
                variant="outline"
                className="gap-1 font-normal"
              >
                <EntityIcon
                  src={equipmentSlotIcon(slot)}
                  alt=""
                  className="size-4"
                />
                {t(`equipment:slots.${slot}`, { defaultValue: slot })}
              </Badge>
            ))}
          </ProfileSection>
        ) : null}

        {profile.traits.length > 0 ? (
          <ProfileSection label={t("unitLookup.traits")}>
            {profile.traits.map((trait) => (
              <Badge
                key={trait}
                variant="outline"
                className="gap-1 font-normal"
              >
                <EntityIcon src={traitIcon(trait)} alt="" className="size-4" />
                {t(`traits:${trait}`, { defaultValue: trait })}
              </Badge>
            ))}
          </ProfileSection>
        ) : null}

        <div className="grid grid-cols-3 gap-3 sm:max-w-md">
          <HdaCell
            icon={statIcon("health")}
            label={t("unitLookup.health")}
            pair={profile.health}
          />
          <HdaCell
            icon={statIcon("damage")}
            label={t("unitLookup.damage")}
            pair={profile.damage}
          />
          <HdaCell
            icon={statIcon("armour")}
            label={t("unitLookup.armour")}
            pair={profile.armour}
          />
        </div>
      </CardContent>
    </Card>
  )
}

function StatRow({
  icon,
  label,
  value,
  children,
}: {
  icon: string
  label: string
  value: string
  children?: ReactNode
}) {
  return (
    <div className="flex items-center gap-2">
      <EntityIcon src={icon} alt={label} className="size-6 opacity-80" />
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
      {children}
    </div>
  )
}

function DamageTypeChip({ type }: { type: string }) {
  const { t } = useTranslation(["damageTypes"])
  return (
    <Badge variant="outline" className="gap-1 font-normal">
      <EntityIcon src={damageTypeIcon(type)} alt="" className="size-4" />
      {t(`damageTypes:${type}`, { defaultValue: type })}
    </Badge>
  )
}

function ProfileSection({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  )
}

function HdaCell({
  icon,
  label,
  pair,
}: {
  icon: string
  label: string
  pair: UnitStatPair
}) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-1 rounded-md border p-2">
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <EntityIcon src={icon} alt="" className="size-4" />
        {label}
      </span>
      <span className="flex items-baseline gap-1 text-sm tabular-nums">
        <span title={t("unitLookup.current")} className="font-semibold">
          {pair.current}
        </span>
        <span className="text-muted-foreground">→</span>
        <span title={t("unitLookup.target")}>{pair.target}</span>
      </span>
    </div>
  )
}

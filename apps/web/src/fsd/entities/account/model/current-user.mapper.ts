import type { CurrentUser } from "./current-user"

export type CurrentUserDto = {
  applicationUserId: string
  displayName?: string | null
  suggestedDisplayName?: string | null
  hasCompletedOnboarding: boolean
  tacticusApiKeyMasked: string | null
  tacticusUserIdMasked: string | null
  analyticsId: string
}

export function mapCurrentUserDtoToDomain(dto: CurrentUserDto): CurrentUser {
  return {
    applicationUserId: dto.applicationUserId,
    displayName: dto.displayName?.trim() ? dto.displayName : null,
    suggestedDisplayName: dto.suggestedDisplayName?.trim()
      ? dto.suggestedDisplayName
      : null,
    hasCompletedOnboarding: dto.hasCompletedOnboarding,
    tacticusApiKeyMasked: dto.tacticusApiKeyMasked,
    tacticusUserIdMasked: dto.tacticusUserIdMasked,
    analyticsId: dto.analyticsId,
  }
}

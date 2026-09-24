## Context

See `proposal.md`, its two delta specs, and the API companion with the same name. `useCampaignEventStatus` reads the active campaign ID from synced live progress and the first active `campaign-event` entry from the catalog. It currently passes only `endUtc` to `seasonEndCountdown`, dropping the entry's existing `confirmed` flag. The calendar query already returns that flag and its schema validates it. The current `GuildRaidCountdown` representation distinguishes due/time/unavailable but not an unconfirmed projection.

## Goals / Non-Goals

**Goals:** Separate confirmed remaining time, unconfirmed projected end, and absent calendar data while keeping event identity and farming eligibility tied to live progress.

**Non-Goals:** Do not change the global calendar schema or the Guild Raid countdown contract; do not infer the real Tyranid end time on the client; do not change which event campaign nodes Today can raid.

## Decisions

1. Carry the active calendar entry's `confirmed` flag into the page-local status derivation alongside `endUtc`. Model end-time presentation as three semantic states: confirmed countdown, unconfirmed projection, and unavailable calendar window. Reuse `seasonEndCountdown` only in the confirmed state. This avoids treating an unconfirmed end as either an exact timer or a generic missing-data failure.
2. Keep `useCampaignEventStatus` page-local because Today is the only consumer of this status line. The existing `@workspace/game-catalog/queries` selector remains the single calendar source and its public API needs no change. Keep `live-progress.activeCampaignEventId` as the activity/identity source; calendar projection must not activate an event that live progress says is inactive.
3. Render localized “End time not confirmed” (or equivalent) for the projected state, no numeric countdown, and retain the current no-window omission for unavailable data. On a confirmed entry, display the existing coarse localized relative time. Both breakpoints use the same semantic state; only the established header layout differs. Update the existing Today tour copy and locale keys rather than adding a separate tour.
4. Apply the API companion first. After the verified occurrence is published and the manifest refreshes, the app's same code path automatically switches from unconfirmed to confirmed countdown. No migration of client storage is needed because the `confirmed` field and schema already exist.

## Risks / Trade-offs

- [Users may lose a useful rough countdown until a slot is verified] → State that the end is unconfirmed rather than displaying a misleading precise phrase; author confirmed occurrences promptly when evidence exists.
- [The calendar is stale or absent while live progress detects an event] → Keep the detected event visible, omit the countdown, and do not present a false zero/expired result.
- [The API occurrence is verified after the app change lands] → The paired changes remain linked; test both projected and confirmed states and ensure the catalog hash refresh transitions between them.

## Open Questions

- What exact verified UTC boundaries will the API companion publish for the reported slot? The app behavior does not depend on their particular values.
